/**
 * Weekly Market Pulse builder. Rule-based, no AI, no secrets.
 *
 *   npm run fetch-news            → writes public/news/<ISO week>.json and index.json
 *   npm run fetch-news -- --dry   → fetch + process, print a summary, write nothing
 *
 * Behaviour on failure: a feed that fails is skipped and logged in the edition metadata.
 * If every feed fails (or anything throws), nothing is written and the previous edition stays untouched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseFeed } from './lib/feed-parser';
import { fetchText } from './lib/fetch';
import { isoWeek, processItems, type RawFeedItem } from '../src/lib/news-rules';
import { editionSchema, newsSourcesFileSchema } from '../src/lib/schema';
import type { Edition, EditionIndex, Region } from '../src/lib/types';

const CONFIG = path.resolve('config/news-sources.json');
const OUT_DIR = path.resolve('public/news');
const KEEP_WEEKS = 12;
const WINDOW_DAYS = 8;
const MAX_ITEMS = 40;
const TOP_N = 5;
const dry = process.argv.includes('--dry');

async function main() {
  const now = new Date();
  const cfg = newsSourcesFileSchema.parse(JSON.parse(fs.readFileSync(CONFIG, 'utf8')));
  const sources = cfg.sources.filter((s) => s.enabled);
  const since = new Date(now.getTime() - WINDOW_DAYS * 86400000);
  const sourceRegions: Record<string, Region | undefined> = {};
  for (const s of sources) sourceRegions[s.name] = s.region;

  const raw: RawFeedItem[] = [];
  const sourcesOk: string[] = [];
  const sourcesFailed: { name: string; error: string }[] = [];

  const results = await Promise.allSettled(
    sources.map(async (s) => {
      const res = await fetchText(s.url);
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      const feed = parseFeed(res.text, s.name, s.authority);
      return { s, feed };
    }),
  );
  results.forEach((r, i) => {
    const s = sources[i];
    if (r.status === 'fulfilled') {
      const fresh = r.value.feed.items.filter((it) => !it.publishedAt || new Date(it.publishedAt) >= since);
      console.log(`✓ ${s.name}: ${r.value.feed.items.length} items (${fresh.length} within ${WINDOW_DAYS} days)`);
      sourcesOk.push(s.name);
      raw.push(...fresh);
    } else {
      const msg = (r.reason as Error)?.message ?? String(r.reason);
      console.log(`✗ ${s.name}: ${msg}`);
      sourcesFailed.push({ name: s.name, error: msg.slice(0, 200) });
    }
  });

  if (sourcesOk.length === 0) {
    console.error('Every feed failed — keeping the previous edition untouched.');
    process.exit(1);
  }

  const { items, top, relevantCount } = processItems(raw, { now, maxItems: MAX_ITEMS, topN: TOP_N, sourceRegions });
  const wk = isoWeek(new Date(now.getTime() - 86400000)); // Monday-morning runs label the week that just ended
  const edition: Edition = {
    week: wk.id,
    from: wk.monday.toISOString().slice(0, 10),
    to: wk.sunday.toISOString().slice(0, 10),
    top,
    items,
    meta: { generatedAt: now.toISOString(), sourcesOk, sourcesFailed, totalFetched: raw.length, totalRelevant: relevantCount },
  };
  editionSchema.parse(edition);

  console.log('');
  console.log(`Edition ${edition.week} (${edition.from} → ${edition.to}): ${raw.length} fetched, ${relevantCount} relevant, ${items.length} kept, ${sourcesFailed.length} feeds failed.`);
  const byType: Record<string, number> = {};
  const byRegion: Record<string, number> = {};
  for (const it of items) {
    byType[it.dealType] = (byType[it.dealType] ?? 0) + 1;
    byRegion[it.region] = (byRegion[it.region] ?? 0) + 1;
  }
  console.log('By type:  ', byType);
  console.log('By region:', byRegion);
  console.log('Top 5:');
  for (const id of top) {
    const it = items.find((x) => x.id === id)!;
    console.log(`  [${it.score}] ${it.title} (${it.source}${it.dealSize ? ', ' + it.dealSize : ''})`);
  }

  if (items.length === 0) {
    console.error('No relevant items this week — keeping the previous edition untouched.');
    process.exit(1);
  }
  if (dry) {
    console.log('\n--dry: nothing written.');
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `${edition.week}.json`), JSON.stringify(edition, null, 2));

  // Prune to the last KEEP_WEEKS editions and rebuild the index.
  const files = fs
    .readdirSync(OUT_DIR)
    .filter((f) => /^\d{4}-W\d{2}\.json$/.test(f))
    .sort()
    .reverse();
  for (const f of files.slice(KEEP_WEEKS)) {
    fs.unlinkSync(path.join(OUT_DIR, f));
    console.log(`pruned ${f}`);
  }
  const kept = files.slice(0, KEEP_WEEKS);
  const index: EditionIndex = {
    latest: kept[0]?.replace('.json', '') ?? null,
    editions: kept.map((f) => {
      const e = JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8')) as Edition;
      return { week: e.week, from: e.from, to: e.to, items: e.items.length, generatedAt: e.meta.generatedAt };
    }),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`\nWrote ${edition.week}.json and index.json (${kept.length} editions kept).`);
}

main().catch((e) => {
  console.error('Market Pulse run failed; previous edition left untouched.', e);
  process.exit(1);
});
