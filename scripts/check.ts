import { checkAll } from '../src/rules/check';
import { components } from '../src/components';

const v = checkAll();
const byRule = new Map<string, number>();
v.forEach((x) => byRule.set(x.rule, (byRule.get(x.rule) ?? 0) + 1));
for (const x of v) console.log(`✗ [${x.rule}] ${x.target}: ${x.message}`);
console.log(`\n${components.length} components checked, ${v.length} violation${v.length === 1 ? '' : 's'}${v.length ? ' (' + [...byRule].map(([r, n]) => `${r}: ${n}`).join(', ') + ')' : ''}`);
process.exit(v.length ? 1 : 0);
