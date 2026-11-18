import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { checkCopyTool, suggestCopyTool, suggestUi } from '../api/handlers';
import { scanCode } from '../lint/scan';
import { composeCode, getCode, getComponent, getRules, getThemeBuild, listComponents, searchComponents } from '../api/handlers';
import { FRAMEWORKS } from '../codegen';
import { site } from '../config/site';
import { fixCode, lintAll } from '../lint/fix';
import { themeToCss } from '../tokens/theme';

const argv = process.argv.slice(2);
const cmd = argv.shift();
const flags: Record<string, string | boolean> = {};
const props: Record<string, string | boolean> = {};
const rest: string[] = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--prop' || a === '-p') { const [k, ...v] = (argv[++i] ?? '').split('='); const val = v.join('='); props[k] = val === 'true' ? true : val === 'false' ? false : val; }
  else if (a.startsWith('--')) { const [k, v] = a.slice(2).split('='); flags[k] = v ?? (argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[++i] : true); }
  else if (a === '-f') flags.framework = argv[++i];
  else rest.push(a);
}
const bin = site.cli;
const fail = (msg: string): never => { console.error(`${bin}: ${msg}`); process.exit(1); };
const guard = <T>(fn: () => T): T => { try { return fn(); } catch (e) { return fail((e as Error).message); } };

function help() {
  console.log(`${site.name} CLI

  ${bin} list                                  List components
  ${bin} search "<need>"                       Find components for a need
  ${bin} info <id>                             Props, defaults, guidelines
  ${bin} add <id...> [-f framework] [--prop k=v] [--out dir] [--stdout] [--force]
                                             Write component code into your project
  ${bin} lint <path...> [--fix]                Flag (and with --fix, correct) off-grid spacing, gaps, raw colours and missing labels
  ${bin} scan <path...> [--json]               Find raw buttons/inputs/cards and other non-Primitive UI, with the swap for each
  ${bin} suggest "<situation>" [-f framework]  The right component for a state, with wording ("user has no projects yet")
  ${bin} copy <button|empty|error|success|confirm|loading> [--subject x --action y --reason z]
  ${bin} check-copy "<text>" [--kind button|heading|message|label]
  ${bin} theme [--ink #111111 --canvas #FFFFFF --dark-ink #E1E1E1 --dark-canvas #1D1D1D --radius 8] [--out theme.css]
  ${bin} tokens [--out theme.css]              The default theme as CSS variables
  ${bin} rules                                 The rule book

Frameworks: ${FRAMEWORKS.join(', ')} (default: html)`);
}

const SKIP = new Set(['node_modules', 'dist', '.git', '.next', '.astro', '.vercel', 'build', 'coverage']);
const EXT = new Set(['.css', '.scss', '.sass', '.less', '.tsx', '.jsx', '.ts', '.js', '.astro', '.svelte', '.vue', '.html']);
function walk(p: string, out: string[] = []): string[] {
  const st = statSync(p);
  if (st.isFile()) { if (EXT.has(extname(p))) out.push(p); return out; }
  for (const f of readdirSync(p)) if (!SKIP.has(f)) walk(join(p, f), out);
  return out;
}

switch (cmd) {
  case 'list': {
    for (const c of guard(() => listComponents()).components) console.log(`${c.id.padEnd(20)} ${c.mark ? `[${c.mark}] `.padEnd(10) : ''.padEnd(10)}${c.description}`);
    break;
  }
  case 'search': console.log(JSON.stringify(searchComponents(rest.join(' ')).results.map((r) => ({ id: r.id, name: r.name, score: r.score })), null, 2)); break;
  case 'info': console.log(JSON.stringify(guard(() => getComponent(rest[0] ?? '')), null, 2)); break;
  case 'rules': {
    const r = getRules();
    for (const x of r.rules) console.log(`• ${x.title} — ${x.statement}`);
    break;
  }
  case 'add': {
    if (!rest.length) fail('add: give at least one component id');
    const fw = String(flags.framework ?? flags.f ?? 'html');
    if (!(FRAMEWORKS as readonly string[]).includes(fw)) fail(`unknown framework "${fw}"`);
    const out = resolve(String(flags.out ?? 'src/components/p8'));
    for (const id of rest) {
      const res = guard(() => getCode({ component: id, framework: fw, props }));
      if (flags.stdout) { console.log(res.code); continue; }
      const file = join(out, res.filename);
      if (existsSync(file) && !flags.force) { console.error(`skip ${file} (exists, use --force)`); continue; }
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, res.code);
      console.log(`added ${file}`);
    }
    if (!flags.stdout) console.log(`\nRequires the theme variables: ${bin} tokens --out src/theme.css`);
    break;
  }
  case 'compose': {
    // compose from a JSON file: { "items": [{ "component": "button", "props": {...} }] }
    const file = rest[0] ?? fail('compose: give a JSON file');
    const spec = JSON.parse(readFileSync(file, 'utf8'));
    console.log(guard(() => composeCode({ framework: flags.framework ?? 'html', ...spec })).code);
    break;
  }
  case 'lint': {
    const targets = rest.length ? rest : ['.'];
    let errors = 0, warns = 0, files = 0, fixed = 0;
    for (const t of targets) for (const f of guard(() => walk(t))) {
      files++;
      const src = readFileSync(f, 'utf8');
      let issues = lintAll(src);
      if (flags.fix && issues.length) {
        const r = fixCode(src);
        if (r.fixes.length) { writeFileSync(f, r.fixed); for (const x of r.fixes) console.log(`${f}:${x.line}  fixed  ${x.rule}  ${x.from}  →  ${x.to}${x.note ? `  (${x.note})` : ''}`); fixed += r.fixes.length; }
        issues = r.remaining;
      }
      for (const i of issues) {
        console.log(`${f}:${i.line}  ${i.severity}  ${i.rule}  ${i.property}: ${i.value}  ${i.message}`);
        i.severity === 'error' ? errors++ : warns++;
      }
    }
    console.log(`\n${files} files, ${fixed ? `${fixed} fixed, ` : ''}${errors} error${errors === 1 ? '' : 's'}, ${warns} warning${warns === 1 ? '' : 's'}`);
    process.exit(errors ? 1 : 0);
    break;
  }
  case 'scan': {
    const targets = rest.length ? rest : ['.'];
    const files = targets.flatMap((t) => guard(() => walk(t))).filter((f) => !/\.(css|scss|sass|less|json|md)$/.test(f)).map((f) => ({ path: f, code: readFileSync(f, 'utf8') }));
    const r = scanCode(files, { framework: flags.framework ? String(flags.framework) : undefined });
    if (flags.json) { console.log(JSON.stringify(r, null, 2)); break; }
    for (const x of r.findings) console.log(`${x.file}:${x.line}  ${x.element}  →  ${x.swap.component}${Object.keys(x.swap.props).length ? ' ' + JSON.stringify(x.swap.props) : ''}\n    ${x.swap.why}`);
    console.log(`\n${r.files} files · ${r.raw} to swap · ${r.adopted} already Primitive · adoption ${r.adoption}%`);
    for (const c of r.byComponent.slice(0, 8)) console.log(`  ${String(c.count).padStart(4)}  ${c.component}`);
    for (const l of r.libraries) console.log(`  library: ${l.name} (${l.files.length} files)`);
    break;
  }
  case 'suggest': {
    const r = guard(() => suggestUi({ situation: rest.join(' '), framework: flags.framework ?? flags.f }));
    console.log(JSON.stringify(r, null, 2));
    break;
  }
  case 'copy': console.log(JSON.stringify(guard(() => suggestCopyTool({ kind: rest[0], subject: flags.subject, action: flags.action, reason: flags.reason, query: flags.query })), null, 2)); break;
  case 'check-copy': {
    const r = guard(() => checkCopyTool({ text: rest.join(' '), kind: flags.kind }));
    for (const i of r.issues) console.log(`${i.severity}  ${i.rule}  ${i.message}${i.suggestion ? `  → ${i.suggestion}` : ''}`);
    console.log(r.ok ? 'ok' : 'needs changes');
    process.exit(r.ok ? 0 : 1);
    break;
  }
  case 'theme': {
    const r = guard(() => getThemeBuild({ light: { ink: flags.ink, canvas: flags.canvas }, dark: { ink: flags['dark-ink'], canvas: flags['dark-canvas'] }, radius: flags.radius ? String(flags.radius) : undefined }));
    if (flags.out) { writeFileSync(String(flags.out), r.css + '\n'); console.log(`wrote ${flags.out}${r.passes ? '' : ' (WARNING: contrast below 4.5:1 somewhere)'}`); }
    else console.log(r.css);
    break;
  }
  case 'tokens': {
    if (flags.out) { writeFileSync(String(flags.out), themeToCss() + '\n'); console.log(`wrote ${flags.out}`); } else console.log(themeToCss());
    break;
  }
  case undefined: case 'help': case '--help': help(); break;
  default: fail(`unknown command "${cmd}" (try ${bin} help)`);
}
