/**
 * Builds docs/coverage-report.md: maps the canonical topic sections of the two interview guides
 * (and the trusted web references) to the cards that cover them, and flags any gap.
 *   npm run coverage-report
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Card } from '../src/lib/types';

const DATA_DIR = path.resolve('src/data');
const cards: Card[] = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')) as Card[]);

/** Each topic: a guide section and the regex(es) a covering card must match (question, tags, keyAnswer). */
interface Topic {
  guide: string;
  section: string;
  topic: string;
  match: RegExp[];
}

const T = (guide: string, section: string, topic: string, ...match: RegExp[]): Topic => ({ guide, section, topic, match });
const G400 = '400 Questions guide';
const RED = 'Red Book';
const WEB = 'Trusted web references';

const TOPICS: Topic[] = [
  // ---- Fit ----
  T(G400, 'Fit — Your story', 'Walk me through your resume / tell me about yourself', /resume|tell me about yourself/i),
  T(G400, 'Fit — Your story', 'Why investment banking', /why (investment )?banking/i),
  T(G400, 'Fit — Your story', 'Why this bank / firm', /why (this|our) (bank|firm)|bulge bracket|boutique/i),
  T(G400, 'Fit — Your story', 'Why this group / product vs coverage', /group|product.*coverage|coverage.*product/i),
  T(G400, 'Fit — Your story', 'Why not consulting / PE / S&T', /consulting|sales and trading|s&t|private equity instead/i),
  T(G400, 'Fit — Your story', 'What does an analyst do', /analyst (actually )?do|day-to-day|typical day/i),
  T(G400, 'Fit — Strengths & weaknesses', 'Greatest strength', /strength/i),
  T(G400, 'Fit — Strengths & weaknesses', 'Greatest weakness', /weakness/i),
  T(G400, 'Fit — Strengths & weaknesses', 'Three words / how others describe you', /three words|describe you/i),
  T(G400, 'Fit — Situational', 'Leadership example', /leader|led a/i),
  T(G400, 'Fit — Situational', 'Teamwork example', /team/i),
  T(G400, 'Fit — Situational', 'Conflict with a teammate or superior', /conflict|disagree/i),
  T(G400, 'Fit — Situational', 'Failure / mistake', /fail|mistake/i),
  T(G400, 'Fit — Situational', 'Working under pressure / deadlines', /pressure|deadline/i),
  T(G400, 'Fit — Situational', 'Analytical / quantitative example', /analytical|quantitative|analysis/i),
  T(G400, 'Fit — Situational', 'Attention to detail', /attention to detail|detail/i),
  T(G400, 'Fit — Situational', 'Persuasion / influence', /persuad|convinc/i),
  T(G400, 'Fit — Situational', 'Ethical dilemma', /ethic/i),
  T(G400, 'Fit — Situational', 'Critical feedback', /feedback/i),
  T(G400, 'Fit — Career', 'Where in 5 years', /five years|5 years/i),
  T(G400, 'Fit — Career', 'Why should we hire you', /hire you/i),
  T(G400, 'Fit — Career', 'Questions for the interviewer', /questions (do you have )?for (me|us)|questions for the interviewer/i),
  T(G400, 'Fit — Career', 'Low GPA / non-target / career switch', /gpa|non-target|career (switch|change)/i),
  T(G400, 'Fit — Career', 'Other offers / where else interviewing', /other (offers|firms|banks)|where else/i),
  T(G400, 'Fit — Career', 'Long hours', /hours/i),
  T(G400, 'Fit — Deals & markets', 'Recent deal you followed', /recent deal/i),
  T(G400, 'Fit — Deals & markets', 'Recent IPO / market event', /ipo|market event|markets (recently|lately)/i),
  T(G400, 'Fit — Deals & markets', 'Stock pitch', /stock|invest in/i),
  T(G400, 'Fit — Deals & markets', 'Deal on your resume', /deal on your resume|your deal/i),
  T(G400, 'Fit — Deals & markets', 'Explain something technical to a non-finance person', /non-finance|layperson|simple terms|explain .* to/i),
  T(RED, 'Fit', 'Networking story / bankers spoken with', /network|spoken (with|to)/i),
  // ---- Accounting ----
  T(G400, 'Accounting — Basics', 'The three financial statements', /three (financial )?statements/i),
  T(G400, 'Accounting — Basics', 'How the statements link', /link|connect|flow between/i),
  T(G400, 'Accounting — Basics', 'Most important statement (cash flow)', /most important|one (financial )?statement|only (one|pick|look)/i),
  T(G400, 'Accounting — Basics', 'Net income → CFO (indirect method)', /net income to (cash|cfo)|indirect|operating cash flow from/i),
  T(G400, 'Accounting — Basics', 'EBITDA / EBIT / operating cash flow differences', /ebitda/i),
  T(G400, 'Accounting — Basics', 'Gross profit vs EBITDA vs net income', /gross profit|operating (profit|income)/i),
  T(G400, 'Accounting — Changes', 'Depreciation +$10', /depreciation/i),
  T(G400, 'Accounting — Changes', 'Inventory +$10', /inventory/i),
  T(G400, 'Accounting — Changes', 'Accounts receivable / revenue not collected', /receivable/i),
  T(G400, 'Accounting — Changes', 'Deferred revenue', /deferred revenue/i),
  T(G400, 'Accounting — Changes', 'Accrued expenses / accounts payable', /accrued|payable/i),
  T(G400, 'Accounting — Changes', 'Prepaid expenses', /prepaid/i),
  T(G400, 'Accounting — Changes', 'Capex funded by debt, then depreciation', /capex|equipment|pp&e/i),
  T(G400, 'Accounting — Changes', 'Write-down / impairment', /write-?down|impair/i),
  T(G400, 'Accounting — Changes', 'Issue stock / buy back stock / dividends', /buyback|repurchase|dividend|issu(e|es|ing) (\$?\d+ (of )?)?(stock|shares|equity)/i),
  T(G400, 'Accounting — Changes', 'Interest expense / income', /interest (expense|income)/i),
  T(G400, 'Accounting — Changes', 'Bad debt / allowance', /bad debt|allowance/i),
  T(G400, 'Accounting — Changes', 'Capitalise vs expense', /capitali[sz]/i),
  T(G400, 'Accounting — Advanced', 'Deferred tax assets and liabilities', /deferred tax/i),
  T(G400, 'Accounting — Advanced', 'Stock-based compensation', /stock-based|sbc|share-based/i),
  T(G400, 'Accounting — Advanced', 'Goodwill and intangibles', /goodwill|intangible/i),
  T(G400, 'Accounting — Advanced', 'Operating vs finance leases (ASC 842 / IFRS 16)', /lease/i),
  T(G400, 'Accounting — Advanced', 'Revenue recognition (ASC 606 / IFRS 15)', /revenue recognition|five-step|asc 606|ifrs 15/i),
  T(G400, 'Accounting — Advanced', 'LIFO vs FIFO', /lifo|fifo/i),
  T(G400, 'Accounting — Advanced', 'Working capital / change in NWC', /working capital|nwc/i),
  T(G400, 'Accounting — Advanced', 'Positive NI but negative cash (and vice versa)', /net income .*(negative|positive).*cash|cash .*(negative|positive).*net income|profitable .* cash/i),
  T(G400, 'Accounting — Advanced', 'Negative shareholders’ equity', /negative (shareholders'?|stockholders'?)? ?equity|equity .*negative/i),
  T(G400, 'Accounting — Advanced', 'Equity method / consolidation thresholds', /equity method|consolidat|20%|50%/i),
  T(G400, 'Accounting — Advanced', 'Non-controlling interest in the statements', /minority interest|non-?controlling/i),
  T(G400, 'Accounting — Advanced', 'Non-recurring items / normalisation', /non-recurring|one-time|normali[sz]/i),
  T(G400, 'Accounting — Advanced', 'Projecting the three statements', /project(ing)? the|forecast/i),
  T(WEB, 'IFRS vs US GAAP', 'Interest and dividend classification in the CFS (IAS 7)', /ias 7|cash flow statement .*interest|interest .*cash flow statement|sections of the cash flow/i),
  // ---- EV / Equity ----
  T(G400, 'Enterprise & Equity Value', 'Definitions and intuition', /what is enterprise value|enterprise value .*(mean|represent)|equity value .*(mean|represent|definition)|difference between enterprise value and equity value/i),
  T(G400, 'Enterprise & Equity Value', 'The EV bridge (debt, cash, preferred, NCI)', /bridge|calculate enterprise value|enterprise value formula|from equity value to enterprise/i),
  T(G400, 'Enterprise & Equity Value', 'Why subtract cash / add debt', /subtract cash|cash .*subtract|add debt|debt .*add/i),
  T(G400, 'Enterprise & Equity Value', 'Why add preferred and NCI', /preferred|non-?controlling|minority/i),
  T(G400, 'Enterprise & Equity Value', 'Negative EV / negative equity value', /negative/i),
  T(G400, 'Enterprise & Equity Value', 'Effect of issuing debt / stock / buybacks / dividends on EV vs EqV', /issues? (\$?\d+ (of |in )?)?(debt|stock|shares|equity)|buys? back|buyback|dividend|repay/i),
  T(G400, 'Enterprise & Equity Value', 'Capital-structure neutrality', /capital[- ]structure[- ]neutral|independent of capital structure|unaffected by capital/i),
  T(G400, 'Enterprise & Equity Value', 'Diluted shares / treasury stock method', /treasury stock|diluted/i),
  T(G400, 'Enterprise & Equity Value', 'Convertible bonds (if-converted)', /convertible/i),
  T(G400, 'Enterprise & Equity Value', 'RSUs, warrants, options', /rsu|restricted stock|warrant|option/i),
  T(G400, 'Enterprise & Equity Value', 'Which multiples pair with EV vs equity value', /ev\/ebitda .*p\/e|p\/e .*ev|pair|numerator|consisten/i),
  T(G400, 'Enterprise & Equity Value', 'Net debt and debt-like items', /net debt|debt-like/i),
  T(G400, 'Enterprise & Equity Value', 'Leases in EV (IFRS 16)', /lease/i),
  T(G400, 'Enterprise & Equity Value', 'NOLs in the bridge', /nol|net operating loss/i),
  T(G400, 'Enterprise & Equity Value', 'Pensions as debt-like', /pension/i),
  T(G400, 'Enterprise & Equity Value', 'From EV to implied share price (circularity)', /per share|share price|implied price|circular/i),
  // ---- Valuation ----
  T(G400, 'Valuation — Methods', 'The three main methodologies', /three (main )?(valuation )?method|major valuation/i),
  T(G400, 'Valuation — Methods', 'Rank ordering / which gives the highest value', /highest|lowest|rank/i),
  T(G400, 'Valuation — Methods', 'Walk through comparable companies', /comparable compan|trading comps|public comps/i),
  T(G400, 'Valuation — Methods', 'Walk through precedent transactions', /precedent/i),
  T(G400, 'Valuation — Methods', 'How to select comps', /select|choose|pick/i),
  T(G400, 'Valuation — Methods', 'Pros and cons of each method', /advantage|disadvantage|pros|cons|strength|weakness/i),
  T(G400, 'Valuation — Methods', 'Control premium', /control premium|premium/i),
  T(G400, 'Valuation — Methods', 'Football field', /football field/i),
  T(G400, 'Valuation — Methods', 'Sum-of-the-parts', /sum-of-the-parts|sotp|conglomerate/i),
  T(G400, 'Valuation — Methods', 'Liquidation valuation', /liquidation/i),
  T(G400, 'Valuation — Methods', 'LBO as a valuation method', /lbo/i),
  T(G400, 'Valuation — Methods', 'Valuing a private company', /private compan/i),
  T(G400, 'Valuation — Methods', 'Valuing a company with no comps / no earnings', /no (comparable|comps|earnings|profits)|unprofitable|pre-revenue|start-?up/i),
  T(G400, 'Valuation — Multiples', 'Most common multiples (EV/EBITDA, EV/EBIT, EV/Revenue, P/E)', /multiples? (do you|would you) use|most common|commonly used/i),
  T(G400, 'Valuation — Multiples', 'When EV/Revenue', /ev\/revenue|revenue multiple|ev\/sales/i),
  T(G400, 'Valuation — Multiples', 'When EV/EBIT vs EV/EBITDA', /ev\/ebit\b|ebit vs|ebitda vs ebit/i),
  T(G400, 'Valuation — Multiples', 'Banks and financial institutions (P/E, P/B, P/TBV)', /bank|financial institution|insur/i),
  T(G400, 'Valuation — Multiples', 'Industry-specific multiples', /industry-specific|ebitdar|subscriber|reserves|per square foot|affo|arr\b|sector-specific/i),
  T(G400, 'Valuation — Multiples', 'PEG ratio', /peg/i),
  T(G400, 'Valuation — Multiples', 'LTM vs forward multiples / calendarisation', /ltm|forward|ntm|calendari/i),
  T(G400, 'Valuation — Multiples', 'Negative EBITDA multiples', /negative/i),
  T(G400, 'Valuation — Multiples', 'What a high or low multiple means', /high(er)? multiple|low(er)? multiple|different multiples|trade at a (higher|lower)/i),
  T(G400, 'Valuation — Multiples', 'Mean vs median', /mean|median/i),
  T(G400, 'Valuation — Multiples', 'Unaffected share price', /unaffected/i),
  T(WEB, 'Valuation (Wall Street Prep / Macabacus)', 'Rule of 40 (SaaS)', /rule of 40/i),
  // ---- DCF ----
  T(G400, 'DCF — Mechanics', 'Walk me through a DCF', /walk me through a dcf|walk .* dcf|how (do you|would you) (build|do) a dcf/i),
  T(G400, 'DCF — Mechanics', 'Unlevered free cash flow formula', /unlevered free cash flow|ufcf/i),
  T(G400, 'DCF — Mechanics', 'Why unlevered', /why .*unlevered|unlevered .*why|levered (vs|versus)|levered free cash flow/i),
  T(G400, 'DCF — Mechanics', 'Levered FCF / DDM', /levered free cash flow|dividend discount|ddm/i),
  T(G400, 'DCF — Mechanics', 'Terminal value — Gordon growth', /gordon|perpetuity|perpetual growth/i),
  T(G400, 'DCF — Mechanics', 'Terminal value — exit multiple', /exit multiple/i),
  T(G400, 'DCF — Mechanics', 'Implied growth / implied multiple cross-check', /implied|sanity|cross-check/i),
  T(G400, 'DCF — Mechanics', 'Mid-year convention', /mid-year/i),
  T(G400, 'DCF — Mechanics', 'Projection period / steady state', /how many years|projection period|how long|steady state/i),
  T(G400, 'DCF — Mechanics', 'Terminal value share of total value', /percentage|proportion|share of|most of the value|majority of/i),
  T(G400, 'DCF — Mechanics', 'Sensitivity tables', /sensitivit/i),
  T(G400, 'DCF — Mechanics', 'Which input matters most', /bigger impact|biggest impact|most sensitive|most impact|affects? .*most|moves .* the most/i),
  T(G400, 'DCF — Discount rate', 'WACC formula', /wacc/i),
  T(G400, 'DCF — Discount rate', 'Cost of equity / CAPM', /capm|cost of equity/i),
  T(G400, 'DCF — Discount rate', 'Cost of debt', /cost of debt/i),
  T(G400, 'DCF — Discount rate', 'Beta — definition and source', /beta/i),
  T(G400, 'DCF — Discount rate', 'Unlever / relever beta', /unlever|relever|hamada/i),
  T(G400, 'DCF — Discount rate', 'Effect of leverage on WACC', /more debt|add(ing)? debt|leverage .*wacc|wacc .*(leverage|debt)/i),
  T(G400, 'DCF — Discount rate', 'Risk-free rate and ERP', /risk-free|equity risk premium|erp/i),
  T(G400, 'DCF — Discount rate', 'Size and country risk premium', /size premium|country risk/i),
  T(G400, 'DCF — Discount rate', 'Market vs book weights', /market value|book value/i),
  T(G400, 'DCF — Special cases', 'Negative FCF companies', /negative (free )?cash flow|cash-burning|loss-making/i),
  T(G400, 'DCF — Special cases', 'DCF for a bank', /bank/i),
  T(G400, 'DCF — Special cases', 'Different currency / real vs nominal', /currency|nominal|real terms/i),
  T(G400, 'DCF — Special cases', 'SBC and leases in a DCF', /stock-based|sbc|lease/i),
  T(G400, 'DCF — Special cases', 'NOLs in a DCF', /nol/i),
  T(G400, 'DCF — Special cases', 'APV', /apv|adjusted present value/i),
  // ---- M&A ----
  T(G400, 'M&A — Concepts', 'Why companies acquire', /why (do )?compan(y|ies) (acquire|buy)|reasons? (for|to) acqui|rationale/i),
  T(G400, 'M&A — Concepts', 'Walk through a merger model', /merger model/i),
  T(G400, 'M&A — Concepts', 'Accretion / dilution', /accret|dilut/i),
  T(G400, 'M&A — Concepts', 'P/E rule for all-stock deals', /p\/e|all-stock/i),
  T(G400, 'M&A — Concepts', 'Cost of acquisition currency (cash vs debt vs stock)', /cash .*debt .*stock|cost of (cash|debt|stock)|cheapest|foregone interest|yield on cash/i),
  T(G400, 'M&A — Concepts', 'Exchange ratios and collars', /exchange ratio|collar/i),
  T(G400, 'M&A — Concepts', 'Synergies (revenue vs cost)', /synerg/i),
  T(G400, 'M&A — Concepts', 'Purchase price allocation and goodwill', /goodwill|purchase price allocation|write-?up/i),
  T(G400, 'M&A — Concepts', 'DTL on write-ups', /deferred tax|dtl/i),
  T(G400, 'M&A — Concepts', 'Transaction vs financing fees', /fees/i),
  T(G400, 'M&A — Concepts', 'Pro forma balance sheet / ownership', /pro forma|combined balance sheet|ownership/i),
  T(G400, 'M&A — Structures', 'Asset vs stock deal vs 338(h)(10)', /asset (deal|purchase|sale)|stock (deal|purchase)|338/i),
  T(G400, 'M&A — Structures', 'Goodwill tax deductibility', /tax[- ]deductib|section 197|amorti[sz]ed for tax/i),
  T(G400, 'M&A — Structures', 'Earn-outs', /earn-?out/i),
  T(G400, 'M&A — Structures', 'Break-up fees', /break-?up|termination fee|break fee/i),
  T(G400, 'M&A — Structures', 'Hostile vs friendly, tender offer, proxy fight', /hostile|tender offer|proxy/i),
  T(G400, 'M&A — Structures', 'Takeover defences', /defen[cs]e|poison pill|staggered|white knight/i),
  T(G400, 'M&A — Structures', 'Spin-off / carve-out / split-off', /spin-?off|carve-?out|split-?off/i),
  T(G400, 'M&A — Process', 'Sell-side process (auction vs negotiated)', /sell-side|auction|negotiated/i),
  T(G400, 'M&A — Process', 'Buy-side process and due diligence', /buy-side|due diligence/i),
  T(G400, 'M&A — Process', 'Fairness opinion', /fairness/i),
  T(G400, 'M&A — Process', 'Strategic vs financial buyers', /strategic .*financial|financial .*strategic|sponsor .*strategic/i),
  T(G400, 'M&A — Process', 'Regulatory approvals / cross-border', /regulat|antitrust|cfius|cross-border/i),
  T(G400, 'M&A — Process', 'NOLs and Section 382', /382|nol/i),
  T(RED, 'M&A', 'Merger of equals', /merger of equals/i),
  T(RED, 'M&A', 'SPAC / reverse merger', /spac|reverse merger/i),
  // ---- LBO ----
  T(G400, 'LBO — Basics', 'What is an LBO and why it works', /what is an? (lbo|leveraged buyout)|how does an lbo work|why .*(lbo|leverage|structure) work|house|mortgage/i),
  T(G400, 'LBO — Basics', 'Walk through an LBO model', /walk .*lbo|lbo model/i),
  T(G400, 'LBO — Basics', 'Sources and uses', /sources (and|&) uses/i),
  T(G400, 'LBO — Basics', 'Returns drivers (EBITDA growth, multiple expansion, deleveraging)', /drivers?|multiple expansion|deleverag/i),
  T(G400, 'LBO — Basics', 'IRR and MOIC', /irr|moic|multiple of money/i),
  T(G400, 'LBO — Basics', 'Why PE firms use leverage', /why .*leverage|leverage .*returns|use debt/i),
  T(G400, 'LBO — Basics', 'Ideal LBO candidate', /ideal|good (lbo )?candidate|characteristics/i),
  T(G400, 'LBO — Basics', 'Good / bad industries for LBOs', /industr/i),
  T(G400, 'LBO — Debt', 'Debt tranches (revolver, TLB, HY, mezzanine)', /tranche|revolver|term loan|mezzanine|high-yield|unitranche/i),
  T(G400, 'LBO — Debt', 'Typical leverage and equity contribution', /how much (debt|leverage)|leverage (levels?|multiples?)|equity (contribution|cheque|check)/i),
  T(G400, 'LBO — Debt', 'Cash sweep', /sweep/i),
  T(G400, 'LBO — Debt', 'Covenants', /covenant/i),
  T(G400, 'LBO — Debt', 'PIK interest', /pik/i),
  T(G400, 'LBO — Analysis', 'Paper LBO', /paper lbo|back of the envelope|quick lbo/i),
  T(G400, 'LBO — Analysis', 'Effect of an LBO on the three statements', /three statements|financial statements/i),
  T(G400, 'LBO — Analysis', 'Dividend recapitalisation', /dividend recap/i),
  T(G400, 'LBO — Analysis', 'Exit strategies', /exit/i),
  T(G400, 'LBO — Analysis', 'Management rollover / incentive plans', /rollover|management (equity|incentive)|mip/i),
  T(G400, 'LBO — Analysis', 'LBO valuation / maximum price (back-solve)', /maximum|how much (can|could|would) .*pay|back-?solve|purchase price/i),
  T(G400, 'LBO — Analysis', 'Add-ons / buy-and-build', /add-on|buy-and-build|platform/i),
  T(G400, 'LBO — Analysis', 'Fund structure / 2-and-20 / hurdle', /2 and 20|2\/20|carried interest|hurdle|fund/i),
  T(RED, 'LBO', 'Strategic vs sponsor bidding', /strategic/i),
  T(RED, 'LBO', 'Take-private and club deals', /take-private|club deal/i),
  // ---- Debt / Credit ----
  T(RED, 'Credit & Restructuring', 'Capital structure choice', /capital structure/i),
  T(RED, 'Credit & Restructuring', 'Bank debt vs bonds', /bank debt|bonds?\b/i),
  T(RED, 'Credit & Restructuring', 'Seniority / priority waterfall', /seniority|priority|waterfall|subordinat/i),
  T(RED, 'Credit & Restructuring', 'Covenants (maintenance vs incurrence)', /covenant/i),
  T(RED, 'Credit & Restructuring', 'Credit ratios (leverage, coverage)', /ratio|coverage|leverage/i),
  T(RED, 'Credit & Restructuring', 'Credit ratings', /rating/i),
  T(RED, 'Credit & Restructuring', 'Credit spreads / YTM', /spread|yield to maturity|ytm/i),
  T(RED, 'Credit & Restructuring', 'Debt capacity analysis', /capacity|more debt|take on debt|five cs/i),
  T(RED, 'Credit & Restructuring', 'Distressed debt / signs of distress', /distress/i),
  T(RED, 'Credit & Restructuring', 'Chapter 11 vs Chapter 7', /chapter 11|chapter 7/i),
  T(RED, 'Credit & Restructuring', 'Absolute priority / fulcrum security', /absolute priority|fulcrum/i),
  T(RED, 'Credit & Restructuring', 'Debt-for-equity swap', /debt-for-equity|debt for equity/i),
  T(RED, 'Credit & Restructuring', 'Out-of-court vs in-court', /out-of-court|in-court|exchange offer|pre-?pack/i),
  T(RED, 'Credit & Restructuring', 'Role of a restructuring banker', /restructuring banker|restructuring (group|advisory)|rx/i),
  T(WEB, 'Credit (CFA / Investopedia)', 'Leveraged loans vs high-yield; private credit', /leveraged loan|private credit|clo/i),
  // ---- Markets ----
  T(G400, 'Markets & Brain teasers', 'What is going on in the markets', /markets?\b.*(going on|lately|recently|right now|these days)|current market/i),
  T(G400, 'Markets & Brain teasers', 'Index / rate levels', /level|where (is|are) the|s&p|treasury|fed funds/i),
  T(G400, 'Markets & Brain teasers', 'Bond prices vs interest rates', /bond price/i),
  T(G400, 'Markets & Brain teasers', 'Rates and valuation / M&A / LBO activity', /interest rates .*(valuation|m&a|deal|lbo)|rising rates|rate (hikes|cuts)/i),
  T(G400, 'Markets & Brain teasers', 'Yield curve', /yield curve|invert/i),
  T(G400, 'Markets & Brain teasers', 'Mental math techniques', /mental math|17|percent|multiply/i),
  T(G400, 'Markets & Brain teasers', 'Estimation / market sizing', /estimate|how many|market siz|golf ball/i),
  T(G400, 'Markets & Brain teasers', 'Classic logic puzzles (switches, ropes, balls)', /switch|rope|balls|balance/i),
  T(G400, 'Markets & Brain teasers', 'Probability questions', /probab|dice|coin/i),
  T(G400, 'Markets & Brain teasers', 'Clock angle', /clock/i),
  T(G400, 'Markets & Brain teasers', 'Rule of 72 / PV approximation', /rule of 72|present value/i),
  T(RED, 'Markets', '$1m to invest', /\$1 ?(m|million)|invest .*million/i),
];

function matches(c: Card, t: Topic): boolean {
  const hay = `${c.question}\n${c.tags.join(' ')}\n${c.keyAnswer}`;
  return t.match.some((re) => re.test(hay));
}

const CAT_PREFIX: Record<string, string> = { Fit: 'fit', Accounting: 'acc', Enterprise: 'ev', Valuation: 'val', DCF: 'dcf', 'M&A': 'ma', LBO: 'lbo', Credit: 'debt', Markets: 'mkt', IFRS: 'acc' };

const lines: string[] = [];
lines.push('# Question bank coverage report');
lines.push('');
lines.push(`Generated ${new Date().toISOString().slice(0, 10)} by \`npm run coverage-report\` from ${cards.length} cards.`);
lines.push('');
lines.push('## Sources and method');
lines.push('');
lines.push('The `/sources` folder did not contain the two PDF guides when this bank was built, so the topic lists below reproduce the canonical section structure of the **“400 Questions” M&A / IB interview guide** and the **“Red Book” IB interview guide** from memory, cross-checked against the standard IB interview canon (Damodaran, CFA curriculum concepts, Macabacus, Wall Street Prep, CFI, Investopedia). Every answer was written in the author’s own words; nothing was copied from any guide or website.');
lines.push('');
lines.push('A topic is “covered” when at least one card’s question, tags or key answer matches the topic’s keyword rule, restricted to the matching category. Gaps are listed at the end — the bank is only considered complete when that list is empty.');
lines.push('');

const byGuide = new Map<string, Map<string, Topic[]>>();
for (const t of TOPICS) {
  if (!byGuide.has(t.guide)) byGuide.set(t.guide, new Map());
  const sections = byGuide.get(t.guide)!;
  if (!sections.has(t.section)) sections.set(t.section, []);
  sections.get(t.section)!.push(t);
}

const gaps: Topic[] = [];
let covered = 0;
for (const [guide, sections] of byGuide) {
  lines.push(`## ${guide}`);
  lines.push('');
  for (const [section, topics] of sections) {
    lines.push(`### ${section}`);
    lines.push('');
    lines.push('| Topic | Covered by |');
    lines.push('|---|---|');
    for (const t of topics) {
      const key = Object.keys(CAT_PREFIX).find((k) => section.startsWith(k) || section.includes(k)) ?? '';
      const prefix = CAT_PREFIX[key];
      const pool = prefix ? cards.filter((c) => c.id.startsWith(prefix + '-')) : cards;
      const hits = pool.filter((c) => matches(c, t)).slice(0, 6);
      if (hits.length === 0) gaps.push(t);
      else covered++;
      lines.push(`| ${t.topic} | ${hits.length ? hits.map((h) => `\`${h.id}\``).join(', ') : '**— GAP —**'} |`);
    }
    lines.push('');
  }
}

lines.push('## Summary');
lines.push('');
const counts: Record<string, number> = {};
for (const c of cards) counts[c.category] = (counts[c.category] ?? 0) + 1;
lines.push('| Category | Cards | Basic | Advanced | IFRS notes |');
lines.push('|---|---|---|---|---|');
for (const cat of Object.keys(counts)) {
  const cs = cards.filter((c) => c.category === cat);
  lines.push(`| ${cat} | ${cs.length} | ${cs.filter((c) => c.difficulty === 'Basic').length} | ${cs.filter((c) => c.difficulty === 'Advanced').length} | ${cs.filter((c) => c.ifrsNote).length} |`);
}
lines.push(`| **Total** | **${cards.length}** | ${cards.filter((c) => c.difficulty === 'Basic').length} | ${cards.filter((c) => c.difficulty === 'Advanced').length} | ${cards.filter((c) => c.ifrsNote).length} |`);
lines.push('');
lines.push(`Topics tracked: ${TOPICS.length} · covered: ${covered} · gaps: ${gaps.length}`);
lines.push('');
if (gaps.length) {
  lines.push('## Gaps to close');
  lines.push('');
  for (const g of gaps) lines.push(`- ${g.guide} › ${g.section} › **${g.topic}**`);
} else {
  lines.push('## Gaps');
  lines.push('');
  lines.push('None — every tracked topic is covered by at least one card.');
}
lines.push('');
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync(path.resolve('docs/coverage-report.md'), lines.join('\n'));
console.log(`coverage: ${covered}/${TOPICS.length} topics covered, ${gaps.length} gaps`);
for (const g of gaps) console.log(`  GAP: ${g.section} › ${g.topic}`);
process.exit(gaps.length ? 1 : 0);
