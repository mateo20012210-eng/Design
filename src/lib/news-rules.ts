/**
 * Rule-based processing for the weekly Market Pulse.
 * Pure functions, shared by the fetch script (Node) and unit tests. No AI, no network.
 */
import type { DealType, NewsItem, Region } from './types';

export interface RawFeedItem {
  title: string;
  link: string;
  description?: string;
  publishedAt?: string; // ISO or RFC date
  source: string;
  authority?: number; // 1..5 from config
}

// ---------- Relevance ----------

const INCLUDE_TERMS = [
  'acquisition', 'acquire', 'acquires', 'acquired', 'acquiring', 'merger', 'merge', 'merges', 'takeover', 'take-over',
  'buyout', 'buy-out', 'lbo', 'leveraged buyout', 'private equity', 'pe firm', 'pe-backed', 'sponsor-backed', 'take-private', 'take private', 'go-private',
  'carve-out', 'carve out', 'carveout', 'spin-off', 'spinoff', 'spin off', 'divestiture', 'divest', 'disposal', 'sells unit', 'sale of',
  'ipo', 'initial public offering', 'listing', 'lists on', 'goes public', 'float', 'flotation', 'spac', 'secondary offering', 'share sale', 'rights issue', 'follow-on offering',
  'leveraged loan', 'high-yield', 'high yield', 'junk bond', 'bond sale', 'bond offering', 'debt offering', 'refinancing', 'refinance', 'private credit', 'direct lending', 'term loan', 'notes offering', 'debt raise',
  'restructuring', 'chapter 11', 'bankruptcy', 'insolvency', 'administration', 'debt-for-equity', 'creditors', 'distressed', 'default',
  'bid', 'bids', 'bidder', 'offer for', 'stake', 'deal', 'to buy', 'agrees to buy', 'buys', 'purchase of', 'combination', 'tie-up', 'joint venture', 'all-cash', 'all-stock', 'valued at', 'valuing', 'valuation',
];

const EXCLUDE_TERMS = [
  'horoscope', 'recipe', 'celebrity', 'football', 'soccer', 'nfl', 'nba', 'premier league', 'oscars', 'grammy', 'box office', 'tv review', 'film review', 'podcast:', 'crossword', 'obituary', 'weather', 'opinion:', 'letters:', 'lottery', 'dating', 'fashion week', 'royal family', 'player', 'transfer window',
  'deal of the day', 'deals on', 'best deals', 'prime day', 'black friday', 'cyber monday', 'coupon', 'discount code', 'sale ends', 'off at amazon', 'price drop', 'shopping',
  'job cuts', 'layoffs', 'earnings call', 'quarterly results', 'q1 results', 'q2 results', 'q3 results', 'q4 results', 'dividend declared',
];

const WORD_BOUNDARY_TERMS = new Set(['bid', 'bids', 'deal', 'float', 'stake', 'ipo', 'lbo', 'spac', 'buys', 'default', 'listing', 'administration']);

function norm(s: string): string {
  return ` ${s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ')} `;
}

function hasTerm(text: string, term: string): boolean {
  if (WORD_BOUNDARY_TERMS.has(term)) return new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`).test(text);
  return text.includes(term);
}

export function relevanceHits(title: string, description = ''): string[] {
  const t = norm(title);
  const d = norm(description);
  const hits: string[] = [];
  for (const term of INCLUDE_TERMS) if (hasTerm(t, term) || hasTerm(d, term)) hits.push(term);
  return hits;
}

export function isRelevant(title: string, description = ''): boolean {
  const t = norm(title);
  const d = norm(description);
  for (const ex of EXCLUDE_TERMS) if (t.includes(ex) || d.includes(ex)) return false;
  const hits = relevanceHits(title, description);
  // Weak single-word signals (deal, stake, bid, listing…) need a second signal or a money figure.
  const weak = new Set(['deal', 'stake', 'bid', 'bids', 'listing', 'float', 'default', 'sale of', 'valuation', 'valued at', 'valuing', 'offer for', 'purchase of', 'administration', 'creditors', 'buys', 'to buy']);
  const strong = hits.filter((h) => !weak.has(h));
  if (strong.length > 0) return true;
  if (hits.length >= 2) return true;
  if (hits.length === 1 && extractDealSize(`${title} ${description}`)) return true;
  return false;
}

// ---------- Deal type ----------

const TYPE_RULES: { type: DealType; terms: string[] }[] = [
  { type: 'Restructuring', terms: ['restructuring', 'chapter 11', 'bankruptcy', 'insolvency', 'administration', 'debt-for-equity', 'creditors', 'distressed', 'default', 'liquidation', 'receivership', 'scheme of arrangement', 'chapter 15', 'files for', 'rescue'] },
  { type: 'Private Equity / Buyouts', terms: ['buyout', 'buy-out', 'lbo', 'leveraged buyout', 'private equity', 'pe firm', 'pe-backed', 'sponsor', 'take-private', 'take private', 'go-private', 'kkr', 'blackstone', 'carlyle', 'apollo', 'tpg', 'bain capital', 'cvc', 'eqt', 'advent', 'warburg', 'permira', 'thoma bravo', 'vista equity', 'silver lake', 'hellman', 'cinven', 'ardian', 'brookfield', 'general atlantic', 'partners group', 'secondary buyout', 'growth equity', 'portfolio company', 'exit', 'continuation fund', 'buyout firm', 'buyout group'] },
  { type: 'ECM / IPOs', terms: ['ipo', 'initial public offering', 'listing', 'lists on', 'goes public', 'float', 'flotation', 'spac', 'secondary offering', 'share sale', 'rights issue', 'follow-on', 'block trade', 'direct listing', 'debut', 'prices shares', 'equity raise', 'stock market debut', 'raises in ipo'] },
  { type: 'DCM / Leveraged Finance', terms: ['leveraged loan', 'high-yield', 'high yield', 'junk bond', 'bond sale', 'bond offering', 'debt offering', 'refinancing', 'refinance', 'private credit', 'direct lending', 'term loan', 'notes offering', 'debt raise', 'bond issue', 'credit facility', 'unitranche', 'loan package', 'debt financing', 'syndicated loan', 'raises debt', 'issues bonds', 'sells bonds', 'debt package', 'financing package', 'clo'] },
  { type: 'M&A', terms: ['acquisition', 'acquire', 'merger', 'merge', 'takeover', 'take-over', 'carve-out', 'carve out', 'spin-off', 'spinoff', 'divestiture', 'divest', 'disposal', 'bid', 'bidder', 'offer for', 'stake', 'to buy', 'buys', 'purchase of', 'combination', 'tie-up', 'joint venture', 'all-cash', 'all-stock', 'sells', 'sale of', 'deal'] },
];

export function classifyDealType(title: string, description = ''): DealType {
  const t = norm(title);
  const d = norm(description);
  const scores = new Map<DealType, number>();
  for (const rule of TYPE_RULES) {
    let s = 0;
    for (const term of rule.terms) {
      if (hasTerm(t, term)) s += 3;
      else if (hasTerm(d, term)) s += 1;
    }
    scores.set(rule.type, s);
  }
  // Priority on ties / when title mentions both a sponsor and an acquisition: PE wins over M&A; Restructuring wins over everything.
  const order: DealType[] = ['Restructuring', 'Private Equity / Buyouts', 'ECM / IPOs', 'DCM / Leveraged Finance', 'M&A'];
  let best: DealType = 'M&A';
  let bestScore = -1;
  for (const type of order) {
    const s = scores.get(type) ?? 0;
    if (s > bestScore) {
      best = type;
      bestScore = s;
    }
  }
  return best;
}

// ---------- Region ----------

const REGION_RULES: { region: Region; terms: string[] }[] = [
  {
    region: 'North America',
    terms: ['united states', ' u.s.', ' us ', 'usa', 'america', 'american', 'canada', 'canadian', 'wall street', 'new york', 'nyse', 'nasdaq', 'california', 'texas', 'silicon valley', 'chicago', 'boston', 'houston', 'toronto', 'tsx', 'sec filing', 'delaware', 'washington', 'florida', 'los angeles', 'san francisco', 'seattle', 'miami', 'ontario', 'quebec', 'montreal', 'vancouver', 'fed ', 'federal reserve', 'ftc', 'doj', 'cfius', 'us$'],
  },
  {
    region: 'Europe',
    terms: ['europe', 'european', 'uk', 'u.k.', 'britain', 'british', 'london', 'ftse', 'lse', 'germany', 'german', 'frankfurt', 'dax', 'france', 'french', 'paris', 'cac', 'italy', 'italian', 'milan', 'spain', 'spanish', 'madrid', 'netherlands', 'dutch', 'amsterdam', 'euronext', 'switzerland', 'swiss', 'zurich', 'six swiss', 'sweden', 'swedish', 'stockholm', 'norway', 'norwegian', 'oslo', 'denmark', 'danish', 'copenhagen', 'finland', 'finnish', 'helsinki', 'ireland', 'irish', 'dublin', 'belgium', 'belgian', 'brussels', 'austria', 'austrian', 'vienna', 'poland', 'polish', 'warsaw', 'portugal', 'lisbon', 'greece', 'athens', 'luxembourg', 'eu ', 'european commission', 'brexit', 'ecb', 'euro ', '€', 'sterling', '£', 'cma ', 'takeover panel', 'aim-listed', 'czech', 'prague', 'hungary', 'budapest', 'romania', 'turkey', 'turkish', 'istanbul', 'nordic', 'baltic'],
  },
  {
    region: 'Latin America',
    terms: ['latin america', 'latam', 'brazil', 'brazilian', 'são paulo', 'sao paulo', 'b3 ', 'bovespa', 'mexico', 'mexican', 'mexico city', 'bmv', 'argentina', 'argentine', 'buenos aires', 'chile', 'chilean', 'santiago', 'colombia', 'colombian', 'bogota', 'bogotá', 'peru', 'peruvian', 'lima', 'uruguay', 'ecuador', 'venezuela', 'panama', 'costa rica', 'guatemala', 'dominican', 'puerto rico', 'real ', 'reais', 'pesos', 'r$'],
  },
  {
    region: 'APAC',
    terms: ['asia', 'asian', 'asia-pacific', 'apac', 'china', 'chinese', 'beijing', 'shanghai', 'shenzhen', 'hong kong', 'hkex', 'hang seng', 'japan', 'japanese', 'tokyo', 'nikkei', 'tse', 'korea', 'korean', 'seoul', 'kospi', 'india', 'indian', 'mumbai', 'delhi', 'bse', 'nse', 'sensex', 'singapore', 'sgx', 'australia', 'australian', 'sydney', 'melbourne', 'asx', 'new zealand', 'indonesia', 'jakarta', 'malaysia', 'kuala lumpur', 'thailand', 'bangkok', 'vietnam', 'philippines', 'manila', 'taiwan', 'taipei', 'pakistan', 'bangladesh', 'yen', '¥', 'yuan', 'renminbi', 'rmb', 'rupee', '₹', 'won ', 'a$', 's$', 'hk$', 'softbank', 'temasek', 'gic '],
  },
  {
    region: 'Middle East & Africa',
    terms: ['middle east', 'gulf', 'gcc', 'saudi', 'riyadh', 'tadawul', 'aramco', 'pif', 'uae', 'emirates', 'dubai', 'abu dhabi', 'adx', 'dfm', 'mubadala', 'adia', 'adq', 'qatar', 'doha', 'qia', 'kuwait', 'bahrain', 'oman', 'israel', 'israeli', 'tel aviv', 'egypt', 'egyptian', 'cairo', 'africa', 'african', 'nigeria', 'lagos', 'south africa', 'johannesburg', 'jse', 'kenya', 'nairobi', 'morocco', 'casablanca', 'ghana', 'ethiopia', 'tanzania', 'dirham', 'riyal', 'rand ', 'naira', 'sovereign wealth fund'],
  },
];

export function classifyRegion(title: string, description = '', sourceRegion?: Region): Region {
  const t = norm(title);
  const d = norm(description);
  const scores = new Map<Region, number>();
  for (const rule of REGION_RULES) {
    let s = 0;
    for (const term of rule.terms) {
      if (t.includes(term)) s += 3;
      else if (d.includes(term)) s += 1;
    }
    if (s > 0) scores.set(rule.region, s);
  }
  if (scores.size === 0) return sourceRegion ?? 'Global';
  let best: Region = 'Global';
  let bestScore = 0;
  for (const [r, s] of scores) {
    if (s > bestScore) {
      best = r;
      bestScore = s;
    }
  }
  // Cross-border deals with similar scores on two regions → Global
  const tied = [...scores.values()].filter((s) => s === bestScore).length;
  if (tied > 1) return 'Global';
  return best;
}

// ---------- Deal size ----------

const CURRENCY: Record<string, string> = { '$': '$', 'us$': '$', 'usd': '$', '€': '€', 'eur': '€', '£': '£', 'gbp': '£', '¥': '¥', 'yen': '¥', 'a$': 'A$', 'c$': 'C$', 'chf': 'CHF', 'sek': 'SEK', 'nok': 'NOK', 'dkk': 'DKK', 'inr': '₹', '₹': '₹', 'hk$': 'HK$', 's$': 'S$', 'r$': 'R$', 'aed': 'AED', 'sar': 'SAR' };
const SIZE_RE = /(us\$|a\$|c\$|hk\$|s\$|r\$|\$|€|£|¥|₹|usd|eur|gbp|chf|sek|nok|dkk|inr|aed|sar)\s?(\d{1,3}(?:[,.]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s?(billion|bn|b|million|mn|m|trillion|tn)\b/i;
const SIZE_RE_SUFFIX = /(\d{1,3}(?:[,.]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s?(billion|bn|million|mn|trillion|tn)\s?(dollars|euros|pounds|yen|rupees|us dollars)\b/i;

/** Extracts a display tag like "$4.5bn" or "€800m" when a clear money figure exists. Returns undefined otherwise. */
export function extractDealSize(text: string): string | undefined {
  const m = SIZE_RE.exec(text);
  let cur: string | undefined;
  let num: string | undefined;
  let unit: string | undefined;
  if (m) {
    cur = CURRENCY[m[1].toLowerCase()] ?? m[1];
    num = m[2];
    unit = m[3].toLowerCase();
  } else {
    const s = SIZE_RE_SUFFIX.exec(text);
    if (!s) return undefined;
    num = s[1];
    unit = s[2].toLowerCase();
    const w = s[3].toLowerCase();
    cur = w.includes('dollar') ? '$' : w.includes('euro') ? '€' : w.includes('pound') ? '£' : w.includes('yen') ? '¥' : '₹';
  }
  const n = parseFloat(num.replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  const u = unit.startsWith('t') ? 'tn' : unit.startsWith('b') ? 'bn' : 'm';
  const formatted = Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
  return `${cur}${formatted}${u}`;
}

/** Numeric value in USD-ish millions for ranking only (currency ignored on purpose). */
export function dealSizeMagnitude(tag: string | undefined): number {
  if (!tag) return 0;
  const m = /([\d.]+)(tn|bn|m)$/.exec(tag);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return m[2] === 'tn' ? n * 1e6 : m[2] === 'bn' ? n * 1e3 : n;
}

// ---------- Deduplication ----------

const TITLE_STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'and', 'or', 'for', 'on', 'with', 'by', 'as', 'at', 'from', 'its', 'is', 'are', 'be', 'after', 'over', 'into', 'says', 'said', 'report', 'sources', 'exclusive', 'update', 'ft', 'wsj', 'reuters', 'bloomberg', 'cnbc', 'news', 'inc', 'plc', 'ltd', 'corp', 'co', 'group', 'up', 'out', 'set', 'near', 'nears', 'talks', 'could', 'may', 'will', 'would', 'about'].map((s) => s));

const SYNONYMS: Record<string, string> = {
  buy: 'acquire', buys: 'acquire', buying: 'acquire', purchase: 'acquire', purchases: 'acquire', acquires: 'acquire', acquired: 'acquire', acquiring: 'acquire', acquisition: 'acquire', takeover: 'acquire',
  merges: 'merger', merge: 'merger', merging: 'merger', combination: 'merger',
  agrees: '', agreed: '', agreement: '', nears: '', near: '', set: '', poised: '', plans: '', planning: '', weighs: '', considers: '', explores: '', exploring: '', eyes: '', reportedly: '',
  bln: 'bn', billion: 'bn', billions: 'bn', million: 'm', mln: 'm', mn: 'm',
};

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/(\d[\d.,]*)\s*(billion|bln|bn|million|mln|mn|m)\b/g, (_m, n: string, u: string) => `${n.replace(/,/g, '')}${u.startsWith('b') ? 'bn' : 'm'}`)
    .replace(/[^a-z0-9$€£¥. ]+/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/\.$/, ''))
    .map((w) => (w in SYNONYMS ? SYNONYMS[w] : w))
    .filter((w) => w && !TITLE_STOP.has(w))
    .join(' ');
}

export function titleSimilarity(a: string, b: string): number {
  const ta = new Set(normalizeTitle(a).split(' ').filter(Boolean));
  const tb = new Set(normalizeTitle(b).split(' ').filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  const jaccard = inter / union;
  const overlap = inter / Math.min(ta.size, tb.size); // handles short vs long headlines
  return Math.max(jaccard, overlap * 0.9);
}

export interface Clustered extends RawFeedItem {
  alsoCoveredBy: { source: string; url: string }[];
  sourceCount: number;
}

/** Groups near-identical headlines across sources; keeps the earliest / most authoritative item as the representative. */
export function dedupe(items: RawFeedItem[], threshold = 0.6): Clustered[] {
  const clusters: Clustered[] = [];
  const sorted = [...items].sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : Infinity;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : Infinity;
    const aa = a.authority ?? 3;
    const ab = b.authority ?? 3;
    if (aa !== ab) return ab - aa; // higher authority first
    return ta - tb; // then earliest
  });
  outer: for (const item of sorted) {
    for (const c of clusters) {
      if (c.link === item.link) continue outer;
      if (titleSimilarity(c.title, item.title) >= threshold) {
        if (c.source !== item.source && !c.alsoCoveredBy.some((x) => x.source === item.source)) {
          c.alsoCoveredBy.push({ source: item.source, url: item.link });
          c.sourceCount++;
        }
        continue outer;
      }
    }
    clusters.push({ ...item, alsoCoveredBy: [], sourceCount: 1 });
  }
  return clusters;
}

// ---------- Ranking ----------

export function scoreItem(item: Clustered, dealSize: string | undefined, now: Date): number {
  let score = 0;
  score += (item.sourceCount - 1) * 25; // covered by several outlets
  const mag = dealSizeMagnitude(dealSize);
  if (mag > 0) score += Math.min(40, 10 + Math.log10(mag + 1) * 7); // bigger deals matter more, log-scaled
  const t = item.publishedAt ? new Date(item.publishedAt).getTime() : NaN;
  if (!Number.isNaN(t)) {
    const ageDays = Math.max(0, (now.getTime() - t) / 86400000);
    score += Math.max(0, 14 - ageDays * 2); // recency, decays over a week
  }
  score += (item.authority ?? 3) * 2;
  const hits = relevanceHits(item.title, item.description ?? '').length;
  score += Math.min(10, hits * 2);
  return Math.round(score * 10) / 10;
}

export function makeExcerpt(description: string | undefined, max = 200): string | undefined {
  if (!description) return undefined;
  const text = description
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return undefined;
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

export function makeId(url: string): string {
  // FNV-1a 32-bit hash of the URL → stable short id
  let h = 0x811c9dc5;
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'n' + h.toString(16).padStart(8, '0');
}

export interface ProcessOptions {
  now: Date;
  maxItems?: number;
  topN?: number;
  sourceRegions?: Record<string, Region | undefined>;
  minScoreGap?: number;
}

/** Full pipeline: filter → dedupe → classify → score → cap. */
export function processItems(raw: RawFeedItem[], opts: ProcessOptions): { items: NewsItem[]; top: string[]; relevantCount: number } {
  const relevant = raw.filter((r) => r.title && r.link && isRelevant(r.title, r.description ?? ''));
  const clusters = dedupe(relevant);
  const items: NewsItem[] = clusters.map((c) => {
    const text = `${c.title} ${c.description ?? ''}`;
    const dealSize = extractDealSize(text);
    return {
      id: makeId(c.link),
      title: c.title.trim(),
      url: c.link,
      source: c.source,
      publishedAt: c.publishedAt ? new Date(c.publishedAt).toISOString() : opts.now.toISOString(),
      dealType: classifyDealType(c.title, c.description ?? ''),
      region: classifyRegion(c.title, c.description ?? '', opts.sourceRegions?.[c.source]),
      dealSize,
      excerpt: makeExcerpt(c.description),
      score: scoreItem(c, dealSize, opts.now),
      alsoCoveredBy: c.alsoCoveredBy,
    };
  });
  items.sort((a, b) => b.score - a.score || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const capped = items.slice(0, opts.maxItems ?? 40);
  const top = capped.slice(0, opts.topN ?? 5).map((i) => i.id);
  return { items: capped, top, relevantCount: relevant.length };
}

// ---------- ISO week helpers ----------

export function isoWeek(date: Date): { year: number; week: number; id: string; monday: Date; sunday: Date } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = d.getUTCFullYear();
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() || 7) - 1));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { year, week, id: `${year}-W${String(week).padStart(2, '0')}`, monday, sunday };
}
