/**
 * npm run knowledge:build [-- --dry-run]
 *
 * Builds Luffy's knowledge base: gather the site's public content → chunk → embed →
 * upsert changed chunks to Upstash Vector and delete ones that no longer exist → write
 * the keyword index (data/luffy-keywords.json). Rerun whenever project stories, blog
 * posts, content/life-story.json or content/services.json change.
 *
 * --dry-run: gather, chunk and write the keyword index only (no Hugging Face or Upstash).
 * Needs HF_TOKEN, UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN (see .env.example).
 * Never prints tokens.
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { chunkDocs } from '@/lib/luffy/chunk';
import { EMBEDDING, KEYWORD_INDEX_PATH, redact } from '@/lib/luffy/config';
import { embedPassages, embeddingRoute } from '@/lib/luffy/embed';
import { buildKeywordIndex } from '@/lib/luffy/keywords';
import { gatherSources, type SourceType } from '@/lib/luffy/sources';
import { indexInfo, listExisting, remove, upsert } from '@/lib/luffy/vector';
import { loadEnv } from './env';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  loadEnv();
  const { docs, skipped } = gatherSources();
  const { chunks, duplicates } = chunkDocs(docs);

  console.log(`Luffy knowledge build${dryRun ? ' (dry run)' : ''}\n`);
  const types: SourceType[] = ['story', 'blog', 'life', 'services'];
  for (const type of types) {
    const ofType = chunks.filter((c) => c.sourceType === type);
    const files = docs.filter((d) => d.sourceType === type).length;
    const avg = ofType.length ? Math.round(ofType.reduce((s, c) => s + c.words, 0) / ofType.length) : 0;
    console.log(`  ${type.padEnd(9)} ${String(files).padStart(2)} source${files === 1 ? ' ' : 's'} → ${String(ofType.length).padStart(3)} chunks (avg ${avg} words)`);
  }
  console.log(`  total     ${chunks.length} chunks${duplicates ? `, ${duplicates} near-duplicate${duplicates === 1 ? '' : 's'} dropped` : ''}`);
  if (skipped.length) {
    console.log('\nSkipped files:');
    for (const s of skipped) console.log(`  ${s.file}: ${s.reason}`);
  } else {
    console.log('\nSkipped files: none');
  }

  const writeKeywords = () => {
    const file = path.join(process.cwd(), KEYWORD_INDEX_PATH);
    if (!existsSync(path.dirname(file))) mkdirSync(path.dirname(file), { recursive: true });
    const index = buildKeywordIndex(chunks);
    writeFileSync(file, JSON.stringify(index));
    console.log(`\nKeyword index: ${KEYWORD_INDEX_PATH} (${index.docCount} chunks, ${Object.keys(index.df).length} terms)`);
  };

  if (dryRun) {
    writeKeywords();
    console.log('\nDry run: nothing was sent to Hugging Face or Upstash.');
    return;
  }

  // Safety checks before writing anything.
  const info = await indexInfo();
  if (info.dimension !== EMBEDDING.dimension) {
    throw new Error(
      `The Upstash index has dimension ${info.dimension}, but ${EMBEDDING.model} makes ${EMBEDDING.dimension}-dimension vectors. Create the index with dimension ${EMBEDDING.dimension} (cosine), or change EMBEDDING in lib/luffy/config.ts.`
    );
  }
  const [probe] = await embedPassages(['Dimension check for Luffy.']);
  if (probe.length !== EMBEDDING.dimension) {
    throw new Error(`${EMBEDDING.model} returned ${probe.length}-dimension vectors, expected ${EMBEDDING.dimension}. Nothing was written.`);
  }
  console.log(`\nChecks: index ${info.dimension}d ${info.similarityFunction}, model ${probe.length}d via ${embeddingRoute()} ✓`);

  const existing = await listExisting();
  const ids = new Set(chunks.map((c) => c.id));
  const changed = chunks.filter((c) => existing.get(c.id) !== c.hash);
  const stale = [...existing.keys()].filter((id) => !ids.has(id));

  if (changed.length) {
    process.stdout.write(`Embedding ${changed.length} chunks… `);
    const vectors = await embedPassages(
      changed.map((c) => c.text),
      16,
      (done) => process.stdout.write(`${done} `)
    );
    process.stdout.write('\n');
    await upsert(
      changed.map((c, i) => ({
        id: c.id,
        vector: vectors[i],
        metadata: { title: c.title, url: c.url, sourceType: c.sourceType, section: c.section, text: c.text, hash: c.hash },
      }))
    );
  }
  if (stale.length) await remove(stale);

  console.log(`\nUpstash Vector: ${changed.length} upserted, ${chunks.length - changed.length} unchanged, ${stale.length} deleted`);
  writeKeywords();
}

main().catch((error: unknown) => {
  console.error(`\n✖ ${redact(error instanceof Error ? error.message : String(error))}`);
  process.exit(1);
});
