/** Parses RSS 2.0 / Atom XML into plain feed items. Node only (used by scripts and tests). */
import { XMLParser } from 'fast-xml-parser';
import type { RawFeedItem } from '../../src/lib/news-rules';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text', cdataPropName: '__cdata', trimValues: true });

type Any = Record<string, unknown>;

function text(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    const o = v as Any;
    if (typeof o.__cdata === 'string') return o.__cdata;
    if (typeof o['#text'] === 'string') return o['#text'] as string;
    if (typeof o['@_href'] === 'string') return o['@_href'] as string;
  }
  return '';
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function atomLink(entry: Any): string {
  const links = asArray(entry.link as Any | Any[]);
  const alt = links.find((l) => typeof l === 'object' && (l['@_rel'] === 'alternate' || !l['@_rel']));
  return text(alt ?? links[0]);
}

/** Google News titles end with " - Publisher"; split it off and use the <source> element when present. */
function splitGoogleTitle(title: string): { title: string; publisher?: string } {
  const m = /^(.*)\s-\s([^-]{2,60})$/.exec(title);
  if (!m) return { title };
  return { title: m[1].trim(), publisher: m[2].trim() };
}

export interface ParsedFeed {
  title: string;
  items: RawFeedItem[];
}

export function parseFeed(xml: string, sourceName: string, authority = 3): ParsedFeed {
  const doc = parser.parse(xml) as Any;
  const items: RawFeedItem[] = [];
  const isGoogle = /google news/i.test(sourceName);

  if (doc.rss && typeof doc.rss === 'object') {
    const channel = ((doc.rss as Any).channel ?? {}) as Any;
    for (const it of asArray(channel.item as Any | Any[])) {
      let title = text(it.title);
      let source = sourceName;
      if (isGoogle) {
        const s = splitGoogleTitle(title);
        title = s.title;
        const src = text(it.source) || s.publisher;
        if (src) source = src;
      }
      const link = text(it.link) || text((it.guid as Any)?.['#text'] ?? it.guid);
      items.push({
        title,
        link,
        description: text(it.description) || text(it['content:encoded']) || undefined,
        publishedAt: toIso(text(it.pubDate) || text(it['dc:date'])),
        source,
        authority,
      });
    }
    return { title: text(channel.title), items };
  }

  if (doc.feed && typeof doc.feed === 'object') {
    const feed = doc.feed as Any;
    for (const e of asArray(feed.entry as Any | Any[])) {
      items.push({
        title: text(e.title),
        link: atomLink(e),
        description: text(e.summary) || text(e.content) || undefined,
        publishedAt: toIso(text(e.published) || text(e.updated)),
        source: sourceName,
        authority,
      });
    }
    return { title: text(feed.title), items };
  }

  if (doc['rdf:RDF'] && typeof doc['rdf:RDF'] === 'object') {
    const rdf = doc['rdf:RDF'] as Any;
    for (const it of asArray(rdf.item as Any | Any[])) {
      items.push({ title: text(it.title), link: text(it.link), description: text(it.description) || undefined, publishedAt: toIso(text(it['dc:date'])), source: sourceName, authority });
    }
    return { title: text((rdf.channel as Any)?.title), items };
  }

  throw new Error('Not an RSS/Atom feed');
}

function toIso(s: string): string | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
