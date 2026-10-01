import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CARD_BY_ID } from '@/lib/cards';
import { useStore } from '@/lib/store';
import { Flashcard, GradeBar } from '@/components/Flashcard';
import { Button, Empty } from '@/components/ui';
import { useHotkeys } from '@/hooks/useHotkeys';
import { relativeDays } from '@/lib/format';

export function CardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const card = id ? CARD_BY_ID.get(id) : undefined;
  const [revealed, setRevealed] = useState(false);

  useHotkeys({
    ' ': () => setRevealed(true),
    b: () => card && dispatch({ type: 'toggleBookmark', cardId: card.id }),
    '1': () => revealed && card && (dispatch({ type: 'grade', cardId: card.id, grade: 'got' }), navigate(-1)),
    '2': () => revealed && card && (dispatch({ type: 'grade', cardId: card.id, grade: 'shaky' }), navigate(-1)),
    '3': () => revealed && card && (dispatch({ type: 'grade', cardId: card.id, grade: 'missed' }), navigate(-1)),
    Escape: () => navigate(-1),
  });

  if (!card) {
    return <Empty icon="🤷" title="Card not found" action={<Link to="/"><Button variant="primary">Back to Study</Button></Link>} />;
  }
  const p = state.progress[card.id];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => navigate(-1)} className="muted hover:text-fg text-sm focus-ring rounded-lg tap inline-flex items-center px-1 -ml-1">
          ← Back
        </button>
        <span className="text-xs muted">{p ? `Box ${p.box} · ${relativeDays(p.due)} · ${p.reviews} review${p.reviews === 1 ? '' : 's'}` : 'Not reviewed yet'}</span>
      </div>
      <Flashcard card={card} revealed={revealed} onReveal={() => setRevealed(true)} bookmarked={state.bookmarks.includes(card.id)} onToggleBookmark={() => dispatch({ type: 'toggleBookmark', cardId: card.id })} showPermalink={false} />
      {revealed && (
        <div className="surface p-3 mt-4">
          <GradeBar
            onGrade={(g) => {
              dispatch({ type: 'grade', cardId: card.id, grade: g });
              navigate(-1);
            }}
          />
        </div>
      )}
    </div>
  );
}
