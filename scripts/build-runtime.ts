import { build } from 'esbuild';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

const result = await build({ entryPoints: ['src/runtime/p8.ts'], bundle: true, minify: true, format: 'iife', target: 'es2020', write: false, legalComments: 'none' });
writeFileSync('public/p8.js', result.outputFiles[0].text);
console.log(`public/p8.js ${(result.outputFiles[0].text.length / 1024).toFixed(0)} KB`);

// Publish the agent docs next to the runtime so https://<site>/skill/SKILL.md etc. resolve.
mkdirSync('public/skill', { recursive: true });
copyFileSync('skills/primitive-systems/SKILL.md', 'public/skill/SKILL.md');
for (const f of ['RULEBOOK.md', 'CHECKBOOK.md', 'CHANGELOG.md', 'AGENTS.md']) if (existsSync(f)) copyFileSync(f, `public/${f}`);
