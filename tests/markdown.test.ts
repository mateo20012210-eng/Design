import { describe, expect, it } from 'vitest';
import { parseBlocks } from '../src/lib/markdown';

describe('markdown block parser', () => {
  it('parses headings, paragraphs, lists, tables and code', () => {
    const src = `### Framework\n\nFirst paragraph\ncontinues here.\n\n- one\n- two\n\n1. a\n2. b\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n\`\`\`\nx = 1\n\`\`\``;
    const blocks = parseBlocks(src);
    expect(blocks.map((b) => b.type)).toEqual(['h', 'p', 'ul', 'ol', 'table', 'code']);
    expect((blocks[1] as { text: string }).text).toBe('First paragraph continues here.');
    expect((blocks[2] as { items: string[] }).items).toEqual(['one', 'two']);
    expect((blocks[4] as { header: string[]; rows: string[][] }).rows).toEqual([['1', '2']]);
    expect((blocks[5] as { text: string }).text).toBe('x = 1');
  });
  it('does not treat HTML as markup', () => {
    const blocks = parseBlocks('<script>alert(1)</script>');
    expect(blocks).toEqual([{ type: 'p', text: '<script>alert(1)</script>' }]);
  });
});
