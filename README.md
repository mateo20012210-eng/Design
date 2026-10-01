# IB Interview Prep

An offline-first Progressive Web App for investment-banking interview preparation. One codebase, installable on **iPhone, iPad and Mac**, usable as a normal website in any browser. **No AI anywhere** — all content is hand-written and the weekly news digest is built by rule-based code.

- **Flashcards** — 300 questions across 9 categories (Fit, Accounting, EV vs. Equity Value, Valuation, DCF, M&A, LBO, Debt & Credit, Markets & Brain Teasers). Every card has a short *key answer*, a complete explanation, common mistakes, likely follow-ups and, where relevant, an *IFRS note*.
- **Spaced repetition** — Leitner system with 5 boxes (1 / 3 / 7 / 14 / 30 days). Grade yourself *Got it / Shaky / Missed* after each reveal.
- **Study modes** — Smart Review (due cards), by category, Basic / Advanced filter, Shuffle All, Mock Interview (10 or 20 mixed questions with an optional 90-second timer), Bookmarked, full-text Search.
- **Progress** — mastery per category, cards due, streak, Leitner box distribution, weakest cards.
- **Market Pulse** — a weekly digest of global deal activity (M&A, PE / buyouts, ECM / IPOs, DCM / leveraged finance, restructuring) built every Monday by a GitHub Actions job from public RSS feeds, with a Top 5, deal-type / region filters, a 12-week archive and offline reading.
- **My Deals** — save any Market Pulse item as an interview talking point and fill in a structured notes template (summary · rationale · valuation · financing · why it matters · risks · my view).
- **Sync** — export / import your progress and deals between devices as a file or a compact code, with *merge* (most recent review per card, union of deals) or *overwrite*.
- **Keyboard-first on Mac / iPad** — `Space` reveal, `1 2 3` grade, `← →` navigate, `B` bookmark, `/` search, `F` focus mode, `?` cheat sheet, `Esc` close.

## Tech stack

Vite · React 18 · TypeScript · Tailwind CSS 4 · `vite-plugin-pwa` (Workbox) · Zod · Vitest. No backend, no external runtime APIs. User data lives in `localStorage`.

## Run locally

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # production build in dist/
npm run preview        # serve dist/ locally (service worker enabled)
```

Other scripts:

| Script | What it does |
|---|---|
| `npm test` | Vitest unit tests (SRS, persistence, sync merge, news filter / classifier / dedupe / deal-size, feed parsing with fixtures) |
| `npm run typecheck` | TypeScript |
| `npm run validate-data` | Validates the question bank (schema, unique ids, near-duplicates, minimum counts) |
| `npm run coverage-report` | Rebuilds `docs/coverage-report.md` and fails if a canonical topic is uncovered |
| `npm run verify-feeds` | Checks every feed in `config/news-sources.json` and writes `docs/feed-verification.md` (`-- --apply` disables failing feeds) |
| `npm run fetch-news` | Builds this week's Market Pulse edition into `public/news/` (`-- --dry` prints only) |
| `npm run icons` | Regenerates PNG icons from `public/favicon.svg` |

## Project layout

```
src/
  data/            question bank, one JSON file per category (bundled at build time → offline)
  lib/             srs.ts (Leitner), storage.ts, store.tsx, sync.ts, session.ts, markdown.tsx,
                   news-rules.ts (relevance / classification / dedupe / ranking), news.ts, schema.ts
  components/      AppShell (responsive shell), Flashcard, NewsItemCard, Onboarding, ui.tsx
  pages/           Study, Session, Card, Search, Progress, Settings, Sync, Pulse, PulseArchive, Deals, DealNotes
scripts/           validate-data, coverage-report, fetch-market-news, verify-feeds, generate-icons
config/            news-sources.json
public/news/       generated editions (YYYY-Www.json) + index.json
tests/             Vitest specs and fixture feeds
docs/              coverage-report.md, content-conventions.md, feed-verification.md
.github/workflows/ deploy.yml (Pages), market-pulse.yml (weekly cron), ci.yml
```

## Add or edit questions

1. Open the category file in `src/data/` (e.g. `accounting.json`). Each card follows the schema in `docs/content-conventions.md`:

   ```json
   {
     "id": "acc-053",
     "category": "Accounting",
     "difficulty": "Basic",
     "question": "…",
     "keyAnswer": "1–3 sentences you would say first.",
     "explanation": "Full explanation in lightweight markdown.",
     "commonMistakes": ["optional"],
     "followUps": ["optional"],
     "ifrsNote": "optional",
     "tags": ["lowercase", "tags"]
   }
   ```

2. Use the next free id for that prefix (`fit-`, `acc-`, `ev-`, `val-`, `dcf-`, `ma-`, `lbo-`, `debt-`, `mkt-`).
3. Run `npm run validate-data` — it rejects schema errors, duplicate ids and near-duplicate questions.
4. Optionally run `npm run coverage-report` to refresh the coverage document.

The explanation renderer supports paragraphs, `**bold**`, `*italic*`, `` `code` ``, `###` headings, `-` bullets, `1.` lists, pipe tables and fenced code blocks. HTML is never interpreted.

A card tagged `recent deal` shows a shortcut to **My Deals** when revealed.

## Add or remove news sources

Edit `config/news-sources.json`:

```json
{ "name": "PE Hub", "url": "https://www.pehub.com/feed/", "region": "North America", "enabled": true, "authority": 4 }
```

- `region` (optional) is the fallback region when a headline has no geographic signal.
- `authority` (1–5) decides which outlet is kept as the representative when several cover the same story; the others are listed as “Also covered by”.
- Set `enabled: false` to pause a feed without deleting it.

Then run `npm run verify-feeds`. Only use feeds that are public and whose terms allow showing headlines with a link back; the app stores headline, source, date, a feed-provided excerpt of at most 200 characters and the link — never the article body.

### How the weekly job works

`scripts/fetch-market-news.ts` (run by `.github/workflows/market-pulse.yml` every Monday 06:00 UTC, or manually via *Run workflow*):

1. Fetches every enabled feed (a failing feed is skipped and logged in the edition's `meta.sourcesFailed`).
2. Keeps items from the last 8 days whose title/description match the deal-keyword dictionary and none of the exclusion terms.
3. Groups near-identical headlines across sources (normalised title similarity), keeping the most authoritative / earliest item.
4. Classifies deal type and region with keyword dictionaries; extracts a deal-size tag when a clear money figure exists (never invented).
5. Scores items (number of sources, deal size, recency, source authority), keeps the top 40 and marks the Top 5.
6. Writes `public/news/<ISO week>.json` and `public/news/index.json`, prunes editions older than 12 weeks, commits, and triggers the Pages deployment. If the run fails, nothing is written and the previous edition stays live.

## Testing the three layouts

Open the dev server and use the browser's device toolbar at 390 px (iPhone — bottom tab bar), 820 / 1180 px (iPad — collapsible sidebar) and 1440 px (Mac — persistent sidebar with focus mode).

## Privacy

Nothing leaves your device. There is no account, no analytics and no server; export files are plain JSON you control.
