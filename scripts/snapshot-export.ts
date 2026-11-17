/** Usage: tsx scripts/snapshot-export.ts <checkout root>  → prints { id: Snap } for that checkout. */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { snapshotOf } from '../src/versions/snapshot';

const root = resolve(process.argv[2] ?? '.');
const idx = await import(pathToFileURL(`${root}/src/components/index.ts`).href);
const cg = await import(pathToFileURL(`${root}/src/codegen/index.ts`).href);
const out: Record<string, unknown> = {};
for (const def of [...idx.components, ...(idx.templates ?? [])]) out[def.id] = snapshotOf(def, cg.generate);
process.stdout.write(JSON.stringify(out));
