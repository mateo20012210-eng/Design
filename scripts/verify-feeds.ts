/**
 * Checks every feed in config/news-sources.json: reachable, parseable, item count, dates, descriptions.
 *   npm run verify-feeds            → prints a report and writes docs/feed-verification.md
 *   npm run verify-feeds -- --apply → additionally sets enabled=false on feeds that fail
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseFeed } from './lib/feed-parser';
import { fetchText } from './lib/fetch';
import { newsSourcesFileSchema } from '../src/lib/schema';
import { isRelevant } from '../src/lib/news-rules';

const CONFIG = path.resolve('config/news-sources.json');
const apply = process.argv.includes('--apply');

interface Row {
  name: string;
  url: string;
  ok: boolean;
  status?: number;
  items?: number;
  relevant?: number;
  withDates?: number;
  withDesc?: number;
  newest?: string;
  error?: string;
}

async function check(name: string, url: string): Promise<Row> {
  try {
    const res = await fetchText(url, 25000);
    if (res.status >= 400) return { name, url, ok: false, status: res.status, error: `HTTP ${res.status}` };
    const feed = parseFeed(res.text, name);
    const items = feed.items;
    const newest = items.map((i) => i.publishedAt).filter(Boolean).sort().reverse()[0];
    return {
      name,
      url,
      ok: items.length > 0,
      status: res.status,
      items: items.length,
      relevant: items.filter((i) => isRelevant(i.title, i.description ?? '')).length,
      withDates: items.filter((i) => i.publishedAt).length,
      withDesc: items.filter((i) => i.description).length,
      newest,
      error: items.length === 0 ? 'feed parsed but contains no items' : undefined,
    };
  } catch (e) {
    return { name, url, ok: false, error: ((e as Error).message ?? String(e)).slice(0, 160) };
  }
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  const cfg = newsSourcesFileSchema.parse(raw);
  const rows = await Promise.all(cfg.sources.map((s) => check(s.name, s.url)));

  const lines: string[] = [];
  lines.push('# Feed verification report');
  lines.push('');
  lines.push(`Generated ${new Date().toISOString()} by \`npm run verify-feeds\`.`);
  lines.push('');
  lines.push('| Feed | Status | Items | Relevant | Dated | With excerpt | Newest item | Note |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    lines.push(`| ${r.name} | ${r.ok ? '✅ OK' : '❌ FAIL'} | ${r.items ?? ''} | ${r.relevant ?? ''} | ${r.withDates ?? ''} | ${r.withDesc ?? ''} | ${r.newest ? r.newest.slice(0, 10) : ''} | ${r.error ?? ''} |`);
  }
  lines.push('');
  lines.push('Only headlines, a short feed-provided excerpt (≤200 characters) and a link to the original article are stored. No full-text content is fetched or reproduced.');
  const report = lines.join('\n');
  console.log(report);
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync(path.resolve('docs/feed-verification.md'), report + '\n');

  if (apply) {
    const failing = new Set(rows.filter((r) => !r.ok).map((r) => r.name));
    for (const s of raw.sources) if (failing.has(s.name)) s.enabled = false;
    fs.writeFileSync(CONFIG, JSON.stringify(raw, null, 2) + '\n');
    console.log(`\n--apply: disabled ${failing.size} failing feed(s) in config.`);
  }
  const failed = rows.filter((r) => !r.ok).length;
  console.log(`\n${rows.length - failed}/${rows.length} feeds OK.`);
}

main();
