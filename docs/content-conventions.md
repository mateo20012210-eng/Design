# Question bank — authoring conventions

These rules apply to every card in `src/data/*.json`.

## Schema (one JSON array per category file)

```json
{
  "id": "acc-001",
  "category": "Accounting",
  "difficulty": "Basic",
  "question": "Interview-style question, as the interviewer would ask it.",
  "keyAnswer": "1–3 sentences: the answer you'd say first, out loud.",
  "explanation": "Full explanation in lightweight markdown (see below).",
  "commonMistakes": ["optional, 1–4 short bullets"],
  "followUps": ["optional, 1–4 likely follow-up questions"],
  "ifrsNote": "optional — only where IFRS genuinely differs from US GAAP",
  "tags": ["lowercase", "2–6 tags"]
}
```

| File | Category | ID prefix |
|---|---|---|
| `fit.json` | Fit / Behavioral | `fit-` |
| `accounting.json` | Accounting | `acc-` |
| `ev-equity.json` | Enterprise Value vs. Equity Value | `ev-` |
| `valuation.json` | Valuation | `val-` |
| `dcf.json` | DCF | `dcf-` |
| `ma.json` | M&A / Merger Models | `ma-` |
| `lbo.json` | LBO | `lbo-` |
| `debt.json` | Debt, Restructuring & Credit | `debt-` |
| `markets.json` | Markets & Brain Teasers | `mkt-` |

IDs are zero-padded three digits (`acc-001`, `acc-002`, …).

## Writing rules

- Written in your own words. Never copy text from any guide or website.
- Technical accuracy first. State every assumption in numerical examples; default **tax rate 25%** unless the question says otherwise.
- `keyAnswer` must stand alone — it is what you would say first in the interview (1–3 sentences, no markdown).
- `explanation` must be complete: logic, step-by-step walkthrough, and a numerical example where it helps. Aim for 120–400 words. Never truncate or summarise away the answer.
- `difficulty`: **Basic** = asked in nearly every first-round interview; **Advanced** = asked in later rounds or to candidates with finance backgrounds. Roughly 55–65% Basic per category.
- `ifrsNote`: add one only where IFRS differs materially from US GAAP (IFRS 16 leases, interest/dividend classification in the cash flow statement, impairment reversals, revaluation model, LIFO prohibition, development cost capitalisation, etc.).
- Fit cards: give a framework + a strong sample answer *structure* (not a canned script) + what the interviewer is really testing.
- Conventions: EV = Enterprise Value, EqV = Equity Value, FCF = free cash flow, UFCF = unlevered FCF, D&A = depreciation & amortisation, NWC = net working capital, TV = terminal value, WACC, CAPM.

## Markdown subset supported by the renderer

- Paragraphs separated by a blank line.
- `**bold**`, `*italic*`, `` `code` ``.
- Headings: `### Heading` (use sparingly; `###` only).
- Bulleted lists (`- item`) and numbered lists (`1. item`).
- Simple tables with a header row and `|---|` separator.
- Fenced code blocks (``` … ```) for mini-models and formulas.
- No HTML, no images, no links.
