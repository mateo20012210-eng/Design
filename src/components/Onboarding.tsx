import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { detectDevice, isStandalone } from '@/lib/device';
import { Button } from './ui';

export function Onboarding() {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState(0);
  const device = useMemo(() => detectDevice(), []);
  if (state.settings.onboardingDone) return null;

  const install = installInstructions(device);
  const slides = [
    {
      icon: '🎴',
      title: 'Welcome to IB Interview Prep',
      body: (
        <>
          <p>300 interview questions across accounting, valuation, DCF, M&A, LBO, credit, markets and fit — each with a key answer and a full explanation.</p>
          <p className="mt-3">Reveal the answer, grade yourself, and spaced repetition brings weak cards back sooner. Everything works offline.</p>
        </>
      ),
    },
    {
      icon: '📰',
      title: 'Market Pulse, every Monday',
      body: (
        <>
          <p>A weekly, rule-based digest of global deal activity (M&A, buyouts, IPOs, leveraged finance, restructurings) from reputable feeds. No AI involved.</p>
          <p className="mt-3">Save any item as a talking point and fill in your own notes to discuss deals confidently in interviews.</p>
        </>
      ),
    },
    {
      icon: install.icon,
      title: isStandalone() ? 'You are all set' : install.title,
      body: isStandalone() ? (
        <p>The app is installed. Use the Sync screen to move progress between your iPhone, iPad and Mac.</p>
      ) : (
        <ol className="list-decimal pl-5 space-y-1.5">
          {install.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      ),
    },
  ];
  const last = step === slides.length - 1;
  const slide = slides[step];

  return (
    <div className="fixed inset-0 z-[60] bg-navy-950/60 flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="surface w-full sm:max-w-md rounded-b-none sm:rounded-b-2xl p-6" style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}>
        <div className="text-4xl mb-3" aria-hidden>
          {slide.icon}
        </div>
        <h2 className="text-xl font-bold">{slide.title}</h2>
        <div className="muted mt-2 text-[0.95rem] leading-relaxed">{slide.body}</div>
        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-1.5" role="group" aria-label={`Step ${step + 1} of ${slides.length}`}>
            {slides.map((_, i) => (
              <span key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-5 bg-accent-700' : 'w-2 bg-navy-200 dark:bg-navy-600'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button variant="primary" onClick={() => (last ? dispatch({ type: 'setSettings', patch: { onboardingDone: true } }) : setStep(step + 1))}>
              {last ? 'Start studying' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function installInstructions(device: ReturnType<typeof detectDevice>): { icon: string; title: string; steps: string[] } {
  switch (device) {
    case 'iphone':
      return {
        icon: '📱',
        title: 'Install on your iPhone',
        steps: ['In Safari, tap the Share button (square with an arrow).', 'Scroll and tap “Add to Home Screen”.', 'Tap “Add”. The app opens full-screen and works offline.'],
      };
    case 'ipad':
      return {
        icon: '📱',
        title: 'Install on your iPad',
        steps: ['In Safari, tap the Share button in the toolbar.', 'Tap “Add to Home Screen”, then “Add”.', 'Tip: with a hardware keyboard, press ? for shortcuts.'],
      };
    case 'mac-safari':
      return {
        icon: '💻',
        title: 'Install on your Mac (Safari)',
        steps: ['In Safari’s menu bar choose File → Add to Dock…', 'Confirm the name and click “Add”.', 'The app now opens in its own window from the Dock and Launchpad.'],
      };
    case 'mac-chrome':
      return {
        icon: '💻',
        title: 'Install on your Mac (Chrome)',
        steps: ['Click the install icon at the right end of the address bar (or ⋮ → Cast, save and share → Install page as app).', 'Click “Install”.', 'The app opens in its own window and appears in Launchpad.'],
      };
    case 'android':
      return { icon: '📱', title: 'Install on Android', steps: ['Open the browser menu (⋮).', 'Tap “Add to Home screen” / “Install app”.', 'Confirm.'] };
    default:
      return { icon: '💻', title: 'Install as a desktop app', steps: ['In Chrome or Edge, click the install icon in the address bar.', 'Click “Install”.', 'You can also simply keep using it as a website.'] };
  }
}
