import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button, Empty, Modal, PageTitle } from '@/components/ui';
import { DEAL_TYPE_CLS } from '@/components/NewsItemCard';
import { cn, formatDate } from '@/lib/format';
import type { DealNotes } from '@/lib/types';

const FIELDS: { key: keyof DealNotes; label: string; hint: string }[] = [
  { key: 'summary', label: 'Deal summary', hint: 'Who is buying what, from whom, for how much, announced when. One or two sentences.' },
  { key: 'rationale', label: 'Strategic rationale', hint: 'Why now, why this target: synergies, growth, capabilities, geography, consolidation.' },
  { key: 'valuation', label: 'Valuation / multiples (if known)', hint: 'EV, EV/EBITDA, premium to unaffected price, how it compares with peers or precedents.' },
  { key: 'financing', label: 'Financing structure', hint: 'Cash vs. stock, new debt (type, amount, leverage), sponsor equity, bridge loans, who advised.' },
  { key: 'whyItMatters', label: 'Why it matters / market trend', hint: 'What it says about the sector, rates, regulation, or deal activity in general.' },
  { key: 'risks', label: 'Risks', hint: 'Antitrust / regulatory, integration, financing, shareholder pushback, execution.' },
  { key: 'myView', label: 'My view', hint: 'Would you have done the deal? Is the price fair? Interviewers love a clear, defended opinion.' },
];

export function DealNotesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const deal = id ? state.deals[id] : undefined;
  const [notes, setNotes] = useState<DealNotes | null>(deal?.notes ?? null);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (deal && !notes) setNotes(deal.notes);
  }, [deal, notes]);

  // Auto-save (debounced)
  useEffect(() => {
    if (!deal || !notes) return;
    if (JSON.stringify(notes) === JSON.stringify(deal.notes)) return;
    const t = window.setTimeout(() => {
      dispatch({ type: 'updateDealNotes', id: deal.id, notes });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    }, 500);
    return () => window.clearTimeout(t);
  }, [notes, deal, dispatch]);

  if (!deal || !notes) {
    return <Empty icon="🤷" title="Deal not found" action={<Link to="/deals"><Button variant="primary">Back to My Deals</Button></Link>} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Link to="/deals" className="muted hover:text-fg text-sm focus-ring rounded-lg tap inline-flex items-center px-1 -ml-1">
          ← My Deals
        </Link>
        <span className={cn('text-xs transition-opacity', saved ? 'opacity-100 text-accent-600' : 'opacity-0')}>Saved ✓</span>
      </div>
      <PageTitle title={deal.title} />
      <div className="flex flex-wrap items-center gap-1.5 -mt-3 mb-5 text-xs muted">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', DEAL_TYPE_CLS[deal.dealType])}>{deal.dealType}</span>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-surface-2">{deal.region}</span>
        {deal.dealSize && <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-navy-50 text-navy-700 dark:bg-navy-700 dark:text-navy-100">{deal.dealSize}</span>}
        <span>
          {deal.source} · {formatDate(deal.publishedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <a href={deal.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-fg">
          Open article ↗
        </a>
      </div>
      {deal.excerpt && <p className="text-sm muted mb-5 surface p-4">{deal.excerpt}</p>}

      <div className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="surface p-4">
            <label htmlFor={f.key} className="font-semibold block">
              {f.label}
            </label>
            <p className="text-xs muted mt-0.5 mb-2">{f.hint}</p>
            <textarea
              id={f.key}
              value={notes[f.key]}
              onChange={(e) => setNotes({ ...notes, [f.key]: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-base bg-surface-2 p-3 text-[0.95rem] leading-relaxed focus-ring resize-y"
              placeholder="Your notes…"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6">
        <Link to="/card/fit-deal" className="hidden" />
        <Button variant="ghost" onClick={() => setConfirm(true)} className="text-rose-600">
          Remove deal
        </Button>
        <Button variant="primary" onClick={() => navigate('/deals')}>
          Done
        </Button>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Remove this deal?">
        <p className="text-sm muted mb-4">Your notes for this deal will be deleted.</p>
        <div className="flex gap-2 justify-end">
          <Button onClick={() => setConfirm(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              dispatch({ type: 'removeDeal', id: deal.id });
              navigate('/deals');
            }}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
