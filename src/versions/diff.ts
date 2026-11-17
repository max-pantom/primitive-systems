import raw from './snapshots.json';
import { components, templates } from '../components';
import { generate } from '../codegen';
import { RELEASES } from '../changelog';
import { snapshotOf, type Snap } from './snapshot';

interface Stored { version: string; commit: string; components: Record<string, Snap> }
const stored = (raw as unknown as { versions: Stored[] }).versions;

const cmp = (a: string, b: string) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0); return 0; };
export const LATEST = 'latest';

let live: Record<string, Snap> | null = null;
export function liveSnapshots(): Record<string, Snap> {
  live ??= Object.fromEntries([...components, ...templates].map((d) => [d.id, snapshotOf(d, generate as never)]));
  return live;
}

export function versionList() {
  return {
    current: RELEASES[0].version,
    versions: [
      ...stored.map((s) => ({ version: s.version, commit: s.commit, components: Object.keys(s.components).length, title: RELEASES.find((r) => r.version === s.version)?.title ?? '' })),
      { version: LATEST, commit: 'working tree', components: Object.keys(liveSnapshots()).length, title: `Current (${RELEASES[0].version})` },
    ],
  };
}

export class VersionError extends Error {}
export function snapshotsAt(version: string): { version: string; snaps: Record<string, Snap> } {
  if (version === LATEST || version === RELEASES[0].version) return { version: RELEASES[0].version, snaps: liveSnapshots() };
  const hit = stored.find((s) => s.version === version);
  if (!hit) throw new VersionError(`No snapshot for version ${version}. Available: ${stored.map((s) => s.version).join(', ')}, ${LATEST}`);
  return { version: hit.version, snaps: hit.components };
}

export type Change = { kind: 'added' | 'removed' | 'changed'; what: 'prop' | 'option' | 'default' | 'type'; name: string; from?: unknown; to?: unknown; breaking: boolean; hint: string };
export interface ComponentDiff {
  id: string; from: string; to: string; status: 'unchanged' | 'changed' | 'added' | 'removed';
  props: Change[]; classesAdded: string[]; classesRemoved: string[]; style: 'unchanged' | 'changed'; markup: 'unchanged' | 'changed';
  breaking: boolean; migration: string[]; notes: string[];
}

const show = (v: unknown) => (typeof v === 'string' ? `"${v}"` : String(v));

export function diffSnaps(id: string, a: Snap | undefined, b: Snap | undefined, from: string, to: string): ComponentDiff {
  const base = { id, from, to, props: [] as Change[], classesAdded: [] as string[], classesRemoved: [] as string[], style: 'unchanged' as const, markup: 'unchanged' as const, breaking: false, migration: [] as string[], notes: [] as string[] };
  if (!a && !b) return { ...base, status: 'unchanged', notes: [`${id} does not exist in either version`] };
  if (!a) return { ...base, status: 'added', notes: [`${id} was added after ${from}; it is available in ${to}.`] };
  if (!b) return { ...base, status: 'removed', breaking: true, migration: [`${id} no longer exists in ${to}. Replace it with the closest component (search_components) or stay on ${from}.`] };
  const props: Change[] = [];
  const A = new Map(a.props.map((p) => [p[0], p])), B = new Map(b.props.map((p) => [p[0], p]));
  for (const [name, p] of B) if (!A.has(name)) props.push({ kind: 'added', what: 'prop', name, to: p[2], breaking: false, hint: `New optional prop "${name}" (default ${show(p[2])}). Existing usage keeps working.` });
  for (const [name, p] of A) {
    const q = B.get(name);
    if (!q) { props.push({ kind: 'removed', what: 'prop', name, from: p[2], breaking: true, hint: `Prop "${name}" was removed and the schema rejects unknown props: delete it from your usage.` }); continue; }
    if (p[1] !== q[1] && JSON.stringify(p[3]) === JSON.stringify(q[3])) props.push({ kind: 'changed', what: 'type', name, from: p[1], to: q[1], breaking: false, hint: `Type of "${name}" is now ${q[1]}.` });
    const gone = (p[3] ?? []).filter((o) => !(q[3] ?? []).includes(o)), fresh = (q[3] ?? []).filter((o) => !(p[3] ?? []).includes(o));
    for (const o of gone) props.push({ kind: 'removed', what: 'option', name, from: o, breaking: true, hint: `Option "${o}" of "${name}" was removed. Use one of: ${(q[3] ?? []).join(', ')}.` });
    for (const o of fresh) props.push({ kind: 'added', what: 'option', name, to: o, breaking: false, hint: `New option "${o}" for "${name}".` });
    if (p[2] !== q[2]) props.push({ kind: 'changed', what: 'default', name, from: p[2], to: q[2], breaking: true, hint: `Default of "${name}" changed from ${show(p[2])} to ${show(q[2])}. Pass ${name}=${show(p[2])} explicitly to keep the old look.` });
  }
  const ca = new Set(a.cls), cb = new Set(b.cls);
  const classesAdded = [...cb].filter((c) => !ca.has(c)), classesRemoved = [...ca].filter((c) => !cb.has(c));
  const style = a.rules !== b.rules ? 'changed' : 'unchanged';
  const markup = a.html !== b.html ? 'changed' : 'unchanged';
  const migration = props.filter((p) => p.breaking || p.kind === 'added').map((p) => p.hint);
  if (classesRemoved.length) migration.push(`Class names removed: ${classesRemoved.join(', ')}. If your own CSS or JS targets them, update it.`);
  if (style === 'changed' || markup === 'changed') migration.push('Generated output changed: call get_code again and replace the pasted code (do not hand-edit generated code).');
  const breaking = props.some((p) => p.breaking) || classesRemoved.length > 0;
  const status = props.length || classesAdded.length || classesRemoved.length || style === 'changed' || markup === 'changed' ? 'changed' : 'unchanged';
  return { ...base, status, props, classesAdded, classesRemoved, style, markup, breaking, migration };
}

/** Release notes between two versions that mention the component. */
function notesFor(id: string, name: string, from: string, to: string): string[] {
  const out: string[] = [];
  for (const r of RELEASES) if (cmp(r.version, from) > 0 && cmp(r.version, to) <= 0)
    for (const item of r.items) if (item.toLowerCase().includes(name.toLowerCase()) || item.toLowerCase().includes(id)) out.push(`${r.version}: ${item}`);
  return out;
}

export function diffComponent(id: string, fromV: string, toV = LATEST): ComponentDiff {
  const a = snapshotsAt(fromV), b = snapshotsAt(toV);
  if (cmp(a.version, b.version) > 0) throw new VersionError(`from (${a.version}) must not be newer than to (${b.version})`);
  const d = diffSnaps(id, a.snaps[id], b.snaps[id], a.version, b.version);
  d.notes.push(...notesFor(id, (b.snaps[id] ?? a.snaps[id])?.name ?? id, a.version, b.version));
  return d;
}

export function diffAll(fromV: string, toV = LATEST) {
  const a = snapshotsAt(fromV), b = snapshotsAt(toV);
  if (cmp(a.version, b.version) > 0) throw new VersionError(`from (${a.version}) must not be newer than to (${b.version})`);
  const ids = [...new Set([...Object.keys(a.snaps), ...Object.keys(b.snaps)])];
  const diffs = ids.map((id) => diffSnaps(id, a.snaps[id], b.snaps[id], a.version, b.version));
  const pick = (s: ComponentDiff['status']) => diffs.filter((d) => d.status === s).map((d) => d.id);
  return {
    from: a.version, to: b.version,
    added: pick('added'), removed: pick('removed'),
    changed: diffs.filter((d) => d.status === 'changed').map((d) => ({ id: d.id, breaking: d.breaking, style: d.style, markup: d.markup, propChanges: d.props.length })),
    breaking: diffs.filter((d) => d.breaking).map((d) => d.id),
    unchanged: pick('unchanged').length,
    releases: RELEASES.filter((r) => cmp(r.version, a.version) > 0 && cmp(r.version, b.version) <= 0).map((r) => ({ version: r.version, title: r.title })),
  };
}

export type PinProp = { name: string; type: string; default: unknown; options: string[] | null };
/** The component's props as they were at `version` (schema pinning). */
export function pinnedProps(id: string, version: string): { version: string; name: string; props: PinProp[] } {
  const s = snapshotsAt(version);
  const snap = s.snaps[id];
  if (!snap) throw new VersionError(`${id} did not exist in ${s.version}`);
  return { version: s.version, name: snap.name, props: snap.props.map(([name, type, def, options]) => ({ name, type, default: def, options })) };
}

/** Validate props against the pinned schema; returns messages (empty = valid). */
export function validatePinned(id: string, version: string, props: Record<string, unknown>): string[] {
  const { props: schema } = pinnedProps(id, version);
  const known = new Map(schema.map((p) => [p.name, p]));
  const errs: string[] = [];
  for (const [k, v] of Object.entries(props)) {
    const p = known.get(k);
    if (!p) { errs.push(`unknown prop "${k}" in ${version}`); continue; }
    if (p.options && !p.options.includes(String(v))) errs.push(`"${k}" must be one of ${p.options.join(', ')} in ${version}`);
    else if (typeof p.default === 'boolean' && typeof v !== 'boolean') errs.push(`"${k}" must be a boolean in ${version}`);
  }
  return errs;
}
