import React from 'react';

/**
 * Tiny markdown → React renderer. Output is built from React elements only
 * (never innerHTML), so the content is sanitised by construction.
 * Supports: paragraphs, ### headings, **bold**, *italic*, `code`,
 * - bullets, 1. numbered lists, simple pipe tables, fenced code blocks.
 */

type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'table'; header: string[]; rows: string[][] };

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((c) => c.trim());
}

export function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i++;
      continue;
    }
    if (line.trim().startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push({ type: 'code', text: buf.join('\n') });
      continue;
    }
    const h = /^#{1,6}\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({ type: 'h', text: h[1] });
      i++;
      continue;
    }
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*[-*•]\s+/, '');
        i++;
        // continuation lines (indented)
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*[-*•]\s+/.test(lines[i])) item += ' ' + lines[i++].trim();
        items.push(item);
      }
      blocks.push({ type: 'ul', items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*\d+[.)]\s+/, '');
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i])) item += ' ' + lines[i++].trim();
        items.push(item);
      }
      blocks.push({ type: 'ol', items });
      continue;
    }
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]));
      blocks.push({ type: 'table', header, rows });
      continue;
    }
    // paragraph: gather until blank line or a block starter
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^\s*[-*•]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('|')
    ) {
      buf.push(lines[i++]);
    }
    blocks.push({ type: 'p', text: buf.join(' ') });
  }
  return blocks;
}

/** Inline formatting: **bold**, *italic*, `code`. */
export function renderInline(text: string, keyPrefix = 'i'): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={`${keyPrefix}-${k++}`}>{renderInline(tok.slice(2, -2), `${keyPrefix}b${k}`)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={`${keyPrefix}-${k++}`}>{tok.slice(1, -1)}</code>);
    else out.push(<em key={`${keyPrefix}-${k++}`}>{renderInline(tok.slice(1, -1), `${keyPrefix}e${k}`)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = React.useMemo(() => parseBlocks(source), [source]);
  return (
    <div className={`prose-answer ${className ?? ''}`}>
      {blocks.map((b, idx) => {
        switch (b.type) {
          case 'h':
            return <h3 key={idx}>{renderInline(b.text, `h${idx}`)}</h3>;
          case 'p':
            return <p key={idx}>{renderInline(b.text, `p${idx}`)}</p>;
          case 'ul':
            return (
              <ul key={idx}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `u${idx}-${j}`)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `o${idx}-${j}`)}</li>
                ))}
              </ol>
            );
          case 'code':
            return (
              <pre key={idx}>
                <code>{b.text}</code>
              </pre>
            );
          case 'table':
            return (
              <table key={idx}>
                <thead>
                  <tr>
                    {b.header.map((h, j) => (
                      <th key={j}>{renderInline(h, `th${idx}-${j}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((r, ri) => (
                    <tr key={ri}>
                      {r.map((c, ci) => (
                        <td key={ci}>{renderInline(c, `td${idx}-${ri}-${ci}`)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
        }
      })}
    </div>
  );
}
