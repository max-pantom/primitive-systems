/** Freeze the current release into src/versions/snapshots.json (run when you cut a release: pnpm snapshot). */
import { readFileSync, writeFileSync } from 'node:fs';
import { components, templates } from '../src/components';
import { generate } from '../src/codegen';
import { RELEASES } from '../src/changelog';
import { snapshotOf } from '../src/versions/snapshot';

const file = 'src/versions/snapshots.json';
const data = JSON.parse(readFileSync(file, 'utf8')) as { versions: { version: string; commit: string; components: unknown }[] };
const version = RELEASES[0].version;
const entry = { version, commit: 'release', components: Object.fromEntries([...components, ...templates].map((d) => [d.id, snapshotOf(d, generate as never)])) };
data.versions = [...data.versions.filter((v) => v.version !== version), entry].sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
writeFileSync(file, JSON.stringify(data));
console.log(`froze ${version} (${Object.keys(entry.components).length} components)`);
