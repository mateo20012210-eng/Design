import { Kbd, Modal } from './ui';

const ROWS: [string[], string][] = [
  [['Space'], 'Reveal the answer'],
  [['1'], 'Grade: Got it'],
  [['2'], 'Grade: Shaky'],
  [['3'], 'Grade: Missed'],
  [['←', '→'], 'Previous / next card'],
  [['B'], 'Bookmark the card'],
  [['/'], 'Search'],
  [['F'], 'Toggle focus mode (desktop)'],
  [['Esc'], 'Close dialogs / leave the session'],
  [['?'], 'This cheat sheet'],
];

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts">
      <ul className="divide-y divide-[var(--border)]">
        {ROWS.map(([keys, desc]) => (
          <li key={desc} className="flex items-center justify-between py-2.5 text-sm">
            <span>{desc}</span>
            <span className="flex gap-1">
              {keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className="muted text-xs mt-4">Shortcuts work on a Mac and on an iPad with a hardware keyboard.</p>
    </Modal>
  );
}
