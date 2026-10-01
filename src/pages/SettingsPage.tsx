import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button, Modal, PageTitle, Segmented, Toggle } from '@/components/ui';
import { ALL_CARDS } from '@/lib/cards';
import { isStandalone } from '@/lib/device';

export function SettingsPage() {
  const { state, dispatch } = useStore();
  const s = state.settings;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div>
      <PageTitle title="Settings" />

      <Section title="Appearance">
        <Row label="Theme" hint="System follows your device setting.">
          <Segmented
            label="Theme"
            value={s.theme}
            onChange={(theme) => dispatch({ type: 'setSettings', patch: { theme } })}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Row>
        <Row label="Font size">
          <Segmented
            label="Font size"
            value={s.fontSize}
            onChange={(fontSize) => dispatch({ type: 'setSettings', patch: { fontSize } })}
            options={[
              { value: 'S', label: 'S' },
              { value: 'M', label: 'M' },
              { value: 'L', label: 'L' },
            ]}
          />
        </Row>
      </Section>

      <Section title="Mock interview">
        <Row label="Timer" hint="Reveal the answer automatically when time is up.">
          <Toggle checked={s.timerEnabled} onChange={(timerEnabled) => dispatch({ type: 'setSettings', patch: { timerEnabled } })} label="Timer" />
        </Row>
        <Row label="Seconds per question">
          <Segmented
            label="Seconds per question"
            value={String(s.timerSeconds)}
            onChange={(v) => dispatch({ type: 'setSettings', patch: { timerSeconds: Number(v) } })}
            options={[
              { value: '60', label: '60' },
              { value: '90', label: '90' },
              { value: '120', label: '120' },
            ]}
          />
        </Row>
      </Section>

      <Section title="Data">
        <Row label="Sync between devices" hint="Export your progress and deals, import them on another device.">
          <Link to="/sync">
            <Button>Open Sync</Button>
          </Link>
        </Row>
        <Row label="Reset progress" hint="Clears review history and bookmarks. Saved deals are kept.">
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            Reset
          </Button>
        </Row>
      </Section>

      <Section title="About">
        <p className="text-sm muted">
          IB Interview Prep · {ALL_CARDS.length} questions · {isStandalone() ? 'Installed as an app' : 'Running in the browser'}. Everything is stored on this device only — no account, no servers, no AI.
        </p>
        <button className="text-sm underline underline-offset-2 mt-2 muted hover:text-fg" onClick={() => dispatch({ type: 'setSettings', patch: { onboardingDone: false } })}>
          Show the welcome guide again
        </button>
      </Section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset progress?">
        <p className="text-sm muted mb-4">This deletes your spaced-repetition history, review log and bookmarks on this device. It cannot be undone. Consider exporting first.</p>
        <div className="flex gap-2 justify-end">
          <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              dispatch({ type: 'resetProgress' });
              setConfirmReset(false);
            }}
          >
            Reset everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-5 mb-4">
      <h2 className="font-bold mb-2">{title}</h2>
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        {hint && <div className="text-xs muted">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
