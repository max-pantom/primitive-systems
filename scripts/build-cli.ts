import { build } from 'esbuild';
import { chmodSync, mkdirSync } from 'node:fs';

mkdirSync('bin', { recursive: true });
await build({
  entryPoints: ['src/cli/index.ts'], outfile: 'bin/primitive.mjs', bundle: true, platform: 'node', format: 'esm', target: 'node20', legalComments: 'none', minify: false,
  banner: { js: "#!/usr/bin/env node\nimport { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);" },
});
chmodSync('bin/primitive.mjs', 0o755);
console.log('built bin/primitive.mjs');
