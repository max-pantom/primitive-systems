import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';

mkdirSync('api', { recursive: true });
for (const [entry, out] of [['src/server/vercel-api.ts', 'api/index.js'], ['src/server/vercel-mcp.ts', 'api/mcp.js']]) {
  await build({
    entryPoints: [entry], outfile: out, bundle: true, platform: 'node', format: 'esm', target: 'node20', legalComments: 'none',
    banner: { js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);" },
  });
  console.log(`built ${out}`);
}
