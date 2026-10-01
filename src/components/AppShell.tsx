import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTier } from '@/hooks/useMediaQuery';
import { useStore } from '@/lib/store';
import { useHotkeys } from '@/hooks/useHotkeys';
import { cn } from '@/lib/format';
import { ShortcutsModal } from './ShortcutsModal';
import { useNewEditionBadge } from '@/lib/news';

const NAV = [
  { to: '/', label: 'Study', icon: '🎴', end: true },
  { to: '/pulse', label: 'Market Pulse', icon: '📰' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

const SECONDARY = [
  { to: '/search', label: 'Search', icon: '🔍' },
  { to: '/deals', label: 'My Deals', icon: '📌' },
  { to: '/sync', label: 'Sync devices', icon: '🔄' },
];

export function AppShell() {
  const tier = useTier();
  const { state, dispatch } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasNewEdition = useNewEditionBadge();

  // Close the tablet drawer on navigation
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const focus = state.settings.focusMode && tier === 'desktop';

  useHotkeys(
    React.useMemo(
      () => ({
        '?': () => setShowShortcuts((v) => !v),
        '/': () => navigate('/search'),
        f: () => dispatch({ type: 'setSettings', patch: { focusMode: !state.settings.focusMode } }),
      }),
      [navigate, dispatch, state.settings.focusMode],
    ),
  );

  const sidebar = (
    <nav className="flex flex-col h-full" aria-label="Main">
      <div className="px-4 pt-5 pb-4" style={{ paddingTop: 'calc(1.25rem + var(--safe-top))' }}>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-navy-800 text-white dark:bg-accent-500 flex items-center justify-center font-black text-sm tracking-tight">IB</div>
          <div>
            <div className="font-bold leading-tight">IB Interview Prep</div>
            <div className="text-xs muted">Flashcards · Market Pulse</div>
          </div>
        </div>
      </div>
      <div className="px-3 space-y-1">
        {NAV.map((n) => (
          <SideLink key={n.to} {...n} badge={n.to === '/pulse' && hasNewEdition} />
        ))}
      </div>
      <div className="px-3 mt-5 space-y-1">
        <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider muted">More</div>
        {SECONDARY.map((n) => (
          <SideLink key={n.to} {...n} />
        ))}
      </div>
      <div className="mt-auto px-3 pb-4 space-y-1" style={{ paddingBottom: 'calc(1rem + var(--safe-bottom))' }}>
        {tier === 'desktop' && (
          <button onClick={() => dispatch({ type: 'setSettings', patch: { focusMode: true } })} className="w-full text-left rounded-xl px-3 h-10 text-sm muted hover:bg-surface-2 focus-ring">
            ◧ Focus mode <span className="ml-1 text-xs opacity-70">(F)</span>
          </button>
        )}
        <button onClick={() => setShowShortcuts(true)} className="w-full text-left rounded-xl px-3 h-10 text-sm muted hover:bg-surface-2 focus-ring">
          ⌨️ Keyboard shortcuts <span className="ml-1 text-xs opacity-70">(?)</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh flex">
      {/* Desktop persistent sidebar / tablet drawer */}
      {tier === 'desktop' && !focus && <aside className="w-64 shrink-0 border-r border-base bg-surface sticky top-0 h-dvh">{sidebar}</aside>}
      {tier === 'tablet' && (
        <>
          <aside className={cn('fixed inset-y-0 left-0 z-40 w-72 bg-surface border-r border-base transition-transform duration-200', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>{sidebar}</aside>
          {sidebarOpen && <div className="fixed inset-0 z-30 bg-navy-950/40" onClick={() => setSidebarOpen(false)} />}
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Tablet top bar */}
        {tier === 'tablet' && (
          <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-surface/90 backdrop-blur border-b border-base" style={{ paddingTop: 'var(--safe-top)' }}>
            <button className="tap rounded-xl hover:bg-surface-2 focus-ring text-xl" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              ☰
            </button>
            <span className="font-semibold">IB Interview Prep</span>
          </header>
        )}
        {focus && (
          <button
            onClick={() => dispatch({ type: 'setSettings', patch: { focusMode: false } })}
            className="fixed top-3 left-3 z-30 rounded-xl bg-surface border border-base px-3 h-9 text-sm muted hover:text-fg shadow focus-ring"
          >
            ◨ Exit focus mode
          </button>
        )}

        <main
          className={cn('flex-1 w-full mx-auto px-4 sm:px-6', tier === 'phone' ? 'pb-24' : 'pb-10', 'max-w-[760px]')}
          style={{ paddingTop: tier === 'phone' ? 'calc(0.75rem + var(--safe-top))' : '1.5rem', paddingLeft: 'max(1rem, var(--safe-left))', paddingRight: 'max(1rem, var(--safe-right))' }}
        >
          <Outlet />
        </main>

        {/* Phone bottom tab bar */}
        {tier === 'phone' && (
          <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-base" style={{ paddingBottom: 'var(--safe-bottom)' }} aria-label="Main">
            <div className="grid grid-cols-4 h-16">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => cn('relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium focus-ring', isActive ? 'text-navy-800 dark:text-accent-300' : 'muted')}
                >
                  <span className="text-xl leading-none" aria-hidden>
                    {n.icon}
                  </span>
                  {n.label}
                  {n.to === '/pulse' && hasNewEdition && <span className="absolute top-2 right-[22%] h-2 w-2 rounded-full bg-accent-500" aria-label="New edition" />}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

function SideLink({ to, label, icon, end, badge }: { to: string; label: string; icon: string; end?: boolean; badge?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn('flex items-center gap-3 rounded-xl px-3 h-11 text-[0.95rem] font-medium transition-colors focus-ring', isActive ? 'bg-navy-800 text-white dark:bg-accent-500 dark:text-white' : 'text-fg hover:bg-surface-2')
      }
    >
      <span aria-hidden className="text-lg w-6 text-center">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge && <span className="rounded-full bg-accent-500 text-white text-[10px] font-bold px-1.5 py-0.5">NEW</span>}
    </NavLink>
  );
}
