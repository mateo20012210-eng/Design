import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { classifyDealType, classifyRegion, dedupe, extractDealSize, isRelevant, isoWeek, makeExcerpt, processItems, titleSimilarity } from '../src/lib/news-rules';
import { parseFeed } from '../scripts/lib/feed-parser';

const fx = (f: string) => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');
const now = new Date('2026-10-02T06:00:00Z');

describe('relevance filter', () => {
  it('keeps deal headlines', () => {
    expect(isRelevant('Acme agrees to acquire Widget for $4.5bn')).toBe(true);
    expect(isRelevant('KKR nears buyout of software group')).toBe(true);
    expect(isRelevant('Startup prices IPO at top of range')).toBe(true);
    expect(isRelevant('Retailer files for Chapter 11 protection')).toBe(true);
    expect(isRelevant('Company launches $500m high-yield bond sale to refinance debt')).toBe(true);
  });
  it('drops noise and shopping "deals"', () => {
    expect(isRelevant('Best deals on headphones this weekend')).toBe(false);
    expect(isRelevant('Premier League transfer: striker completes move')).toBe(false);
    expect(isRelevant('Weather: storms expected across the region')).toBe(false);
    expect(isRelevant('Quarterly results beat expectations')).toBe(false);
  });
  it('needs a second signal for weak single words', () => {
    expect(isRelevant('A good deal for consumers')).toBe(false);
    expect(isRelevant('Investor builds stake in retailer', '')).toBe(false);
    expect(isRelevant('Investor builds $2bn stake in retailer')).toBe(true);
    expect(isRelevant('Activist builds stake and demands sale of the company')).toBe(true);
  });
});

describe('deal type classifier', () => {
  it('classifies the five types', () => {
    expect(classifyDealType('Acme agrees to acquire Widget Industries')).toBe('M&A');
    expect(classifyDealType('KKR nears €800m buyout of German software group')).toBe('Private Equity / Buyouts');
    expect(classifyDealType('Fintech prices IPO at top of range')).toBe('ECM / IPOs');
    expect(classifyDealType('Company launches $500m high-yield bond sale to refinance debt')).toBe('DCM / Leveraged Finance');
    expect(classifyDealType('Retailer files for Chapter 11 as creditors push for debt-for-equity swap')).toBe('Restructuring');
  });
  it('prefers PE when a sponsor acquires', () => {
    expect(classifyDealType('Blackstone to acquire UK property group in take-private')).toBe('Private Equity / Buyouts');
  });
  it('falls back to M&A on a generic deal', () => {
    expect(classifyDealType('Two shipping groups agree all-share combination')).toBe('M&A');
  });
});

describe('region classifier', () => {
  it('uses countries, cities, exchanges and currencies', () => {
    expect(classifyRegion('KKR nears €800m buyout of Frankfurt-listed software group')).toBe('Europe');
    expect(classifyRegion('Fintech prices IPO raising R$2.1 billion in São Paulo')).toBe('Latin America');
    expect(classifyRegion('Tokyo-listed conglomerate sells ¥300bn stake')).toBe('APAC');
    expect(classifyRegion('Saudi PIF takes stake in Riyadh developer')).toBe('Middle East & Africa');
    expect(classifyRegion('Nasdaq-listed Acme buys Texas rival')).toBe('North America');
  });
  it('falls back to the source region, then Global', () => {
    expect(classifyRegion('Company agrees merger with rival', '', 'Latin America')).toBe('Latin America');
    expect(classifyRegion('Company agrees merger with rival')).toBe('Global');
  });
  it('marks cross-border ties as Global', () => {
    expect(classifyRegion('London group agrees merger with New York rival')).toBe('Global');
  });
});

describe('deal size extraction', () => {
  it.each([
    ['Acme to buy Widget for $4.5 billion', '$4.5bn'],
    ['KKR nears €800 million buyout', '€800m'],
    ['Group raises £1.2bn in IPO', '£1.2bn'],
    ['Fund takes $300m stake', '$300m'],
    ['Deal valued at US$2 billion', '$2bn'],
    ['Company sells 300 billion yen of bonds', '¥300bn'],
    ['Deal worth 1.5 billion euros agreed', '€1.5bn'],
    ['Investor builds $1,250 million position', '$1250m'],
  ])('%s → %s', (text, expected) => {
    expect(extractDealSize(text)).toBe(expected);
  });
  it('returns undefined when no clear figure exists', () => {
    expect(extractDealSize('Acme agrees to acquire Widget')).toBeUndefined();
    expect(extractDealSize('Shares rose 5% after the announcement')).toBeUndefined();
    expect(extractDealSize('100 million users')).toBeUndefined();
  });
});

describe('deduplication', () => {
  it('measures headline similarity', () => {
    expect(titleSimilarity('Acme Corp agrees to buy Widget Industries for $4.5 billion', 'Acme Corp to acquire Widget Industries in $4.5bn deal')).toBeGreaterThanOrEqual(0.6);
    expect(titleSimilarity('Acme Corp agrees to buy Widget Industries', 'Fintech prices IPO at top of range')).toBeLessThan(0.3);
  });
  it('groups the same story across sources, keeping the most authoritative item', () => {
    const items = [
      { title: 'Acme Corp to acquire Widget Industries in $4.5bn deal', link: 'https://b.com/1', source: 'B', authority: 3, publishedAt: '2026-09-28T08:00:00Z' },
      { title: 'Acme Corp agrees to buy Widget Industries for $4.5 billion', link: 'https://a.com/1', source: 'A', authority: 5, publishedAt: '2026-09-28T09:00:00Z' },
      { title: 'Acme Corp agrees to buy Widget Industries for $4.5 billion', link: 'https://a.com/1', source: 'A', authority: 5, publishedAt: '2026-09-28T09:00:00Z' },
      { title: 'Fintech prices IPO at top of range', link: 'https://c.com/2', source: 'C', authority: 3 },
    ];
    const out = dedupe(items);
    expect(out).toHaveLength(2);
    const acme = out.find((o) => o.source === 'A')!;
    expect(acme).toBeTruthy();
    expect(acme.sourceCount).toBe(2);
    expect(acme.alsoCoveredBy).toEqual([{ source: 'B', url: 'https://b.com/1' }]);
  });
});

describe('feed parsing (fixtures)', () => {
  it('parses RSS 2.0 with CDATA and dates', () => {
    const feed = parseFeed(fx('rss-sample.xml'), 'Sample', 4);
    expect(feed.title).toBe('Sample Deals Feed');
    expect(feed.items).toHaveLength(5);
    expect(feed.items[0].link).toBe('https://example.com/deals/acme-widget');
    expect(feed.items[0].publishedAt).toBe('2026-09-28T09:00:00.000Z');
    expect(feed.items[0].description).toContain('<b>acquire</b>');
    expect(feed.items[0].authority).toBe(4);
  });
  it('parses Atom with alternate links and content', () => {
    const feed = parseFeed(fx('atom-sample.xml'), 'Atom');
    expect(feed.items).toHaveLength(2);
    expect(feed.items[0].link).toBe('https://atom.example.com/acme-widget');
    expect(feed.items[1].link).toBe('https://atom.example.com/tokyo-block');
    expect(feed.items[1].publishedAt).toBe('2026-09-30T02:00:00.000Z');
    expect(feed.items[1].description).toContain('4% discount');
  });
  it('uses the publisher as source for Google News items', () => {
    const feed = parseFeed(fx('google-news-sample.xml'), 'Google News · Private equity', 2);
    expect(feed.items[0].source).toBe('Financial Times');
    expect(feed.items[0].title).toBe('Blackstone agrees $3 billion take-private of UK property group');
  });
  it('rejects non-feeds', () => {
    expect(() => parseFeed('<html><body>nope</body></html>', 'x')).toThrow();
  });
});

describe('end-to-end processing', () => {
  it('filters, dedupes, classifies, ranks and caps', () => {
    const raw = [...parseFeed(fx('rss-sample.xml'), 'Sample', 4).items, ...parseFeed(fx('atom-sample.xml'), 'Atom', 3).items, ...parseFeed(fx('google-news-sample.xml'), 'Google News · PE', 2).items];
    const { items, top, relevantCount } = processItems(raw, { now, maxItems: 40, topN: 5 });
    expect(relevantCount).toBe(7); // headphones dropped
    expect(items.length).toBe(6); // Acme story merged across two sources
    const acme = items.find((i) => i.title.startsWith('Acme'))!;
    expect(acme.source).toBe('Sample'); // higher authority kept
    expect(acme.alsoCoveredBy[0].source).toBe('Atom');
    expect(acme.dealSize).toBe('$4.5bn');
    expect(acme.region).toBe('North America');
    expect(top[0]).toBe(acme.id); // 2 sources + large size → top of the week
    expect(top).toHaveLength(5);
    const brazil = items.find((i) => i.title.includes('Brazilian'))!;
    expect(brazil.dealType).toBe('ECM / IPOs');
    expect(brazil.region).toBe('Latin America');
    expect(brazil.dealSize).toBe('R$2.1bn');
    const ch11 = items.find((i) => i.title.includes('Chapter 11'))!;
    expect(ch11.dealType).toBe('Restructuring');
    expect(ch11.excerpt).toBe('The company has $1.2bn of high-yield bonds outstanding.');
    for (const i of items) expect(i.excerpt?.length ?? 0).toBeLessThanOrEqual(201);
  });
  it('excerpts strip HTML and cap at ~200 chars', () => {
    const long = '<p>' + 'word '.repeat(80) + '</p>';
    const ex = makeExcerpt(long)!;
    expect(ex.length).toBeLessThanOrEqual(201);
    expect(ex.endsWith('…')).toBe(true);
    expect(ex).not.toContain('<');
    expect(makeExcerpt('a &amp; b')).toBe('a & b');
  });
});

describe('ISO week', () => {
  it('computes week ids and Monday/Sunday', () => {
    const w = isoWeek(new Date('2026-10-01T00:00:00Z')); // Thursday
    expect(w.id).toBe('2026-W40');
    expect(w.monday.toISOString().slice(0, 10)).toBe('2026-09-28');
    expect(w.sunday.toISOString().slice(0, 10)).toBe('2026-10-04');
    expect(isoWeek(new Date('2027-01-01T00:00:00Z')).id).toBe('2026-W53');
    expect(isoWeek(new Date('2026-01-01T00:00:00Z')).id).toBe('2026-W01');
  });
});
