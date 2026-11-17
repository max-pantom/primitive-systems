import { writeFileSync } from 'node:fs';
import { EXCEPTIONS, RULES } from '../src/rules/rulebook';
import { checkAll, checkNode, checkRules, variants } from '../src/rules/check';
import { components } from '../src/components';
import { site } from '../src/config/site';

const rule = RULES.map((r) => `### ${r.title} \`${r.id}\`\n\n${r.statement}\n${EXCEPTIONS.filter((e) => e.rule === r.id).map((e) => `\n- **Exception — \`${e.target}\`:** ${e.reason}`).join('')}\n`).join('\n');
writeFileSync('RULEBOOK.md', `# ${site.name} rule book\n\nGenerated from \`src/rules/rulebook.ts\`. Do not edit by hand. Every rule below is checked automatically (see CHECKBOOK.md).\n\n${rule}`);

const rows = components.map((d) => {
  const style = checkRules(d).length === 0;
  const a11y = variants(d).every((p, i) => checkNode(d, d.render(p), String(i)).length === 0);
  return `| ${d.name} | \`${d.id}\` | ${style ? 'pass' : 'FAIL'} | ${a11y ? 'pass' : 'FAIL'} | ${d.guidelines ? 'yes' : 'NO'} |`;
});
const total = checkAll().length;
writeFileSync('CHECKBOOK.md', `# ${site.name} check book

Run \`pnpm rules\` to execute every check. The same checks run in \`pnpm test\`, so a violation fails the build.

| Check | What it verifies |
| --- | --- |
${RULES.map((r) => `| \`${r.id}\` | ${r.title} |`).join('\n')}

Checks run on every component's style rules (all states) and on its rendered markup in two variants (defaults and an everything-toggled variant).

## Result: ${total === 0 ? 'all components pass' : `${total} violation(s)`}

| Component | id | Style rules | Markup / a11y | Guidelines |
| --- | --- | --- | --- | --- |
${rows.join('\n')}
`);
console.log('wrote RULEBOOK.md and CHECKBOOK.md');
