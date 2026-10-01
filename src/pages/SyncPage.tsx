import { useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { createExport, encodeCompact, mergeImport, overwriteImport, parseImport, type ExportPayload } from '@/lib/sync';
import { Button, PageTitle } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

export function SyncPage() {
  const { state, dispatch } = useStore();
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pending, setPending] = useState<ExportPayload | null>(null);
  const [pasted, setPasted] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const counts = { cards: Object.keys(state.progress).length, bookmarks: state.bookmarks.length, deals: Object.keys(state.deals).length };

  const download = () => {
    const payload = createExport(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ib-prep-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMessage({ kind: 'ok', text: 'Export file downloaded.' });
  };

  const copyCode = async () => {
    try {
      const code = encodeCompact(createExport(state));
      await navigator.clipboard.writeText(code);
      setMessage({ kind: 'ok', text: `Compact code copied (${Math.round(code.length / 1024)} KB). Paste it on the other device.` });
    } catch {
      setMessage({ kind: 'err', text: 'Clipboard not available. Use the file export instead.' });
    }
  };

  const share = async () => {
    const payload = createExport(state);
    const file = new File([JSON.stringify(payload)], `ib-prep-export.json`, { type: 'application/json' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: 'IB Interview Prep export' });
      } catch {
        /* cancelled */
      }
    } else download();
  };

  const stage = (text: string) => {
    try {
      const payload = parseImport(text);
      setPending(payload);
      setMessage(null);
    } catch (e) {
      setMessage({ kind: 'err', text: (e as Error).message });
    }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    stage(await f.text());
  };

  const apply = (mode: 'merge' | 'overwrite') => {
    if (!pending) return;
    const next = mode === 'merge' ? mergeImport(state, pending) : overwriteImport(state, pending);
    dispatch({ type: 'replace', state: next });
    setPending(null);
    setPasted('');
    setMessage({ kind: 'ok', text: mode === 'merge' ? 'Merged. Most recent review per card kept, deals combined.' : 'Imported. Previous data on this device was replaced.' });
  };

  return (
    <div>
      <PageTitle title="Sync devices" subtitle="No account needed. Move your progress with a small file or a code." />

      <section className="surface p-5 mb-4">
        <h2 className="font-bold">1 · Export from this device</h2>
        <p className="text-sm muted mt-1">
          {counts.cards} cards with progress · {counts.bookmarks} bookmarks · {counts.deals} saved deals
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="primary" onClick={download}>
            Download file
          </Button>
          <Button onClick={share}>Share…</Button>
          <Button onClick={copyCode}>Copy compact code</Button>
        </div>
        <p className="text-xs muted mt-3">On iPhone/iPad, “Share…” lets you AirDrop the file to your Mac or save it to iCloud Drive.</p>
      </section>

      <section className="surface p-5 mb-4">
        <h2 className="font-bold">2 · Import on another device</h2>
        <div className="flex flex-wrap gap-2 mt-4">
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="primary" onClick={() => fileRef.current?.click()}>
            Choose file
          </Button>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium" htmlFor="paste">
            …or paste a compact code
          </label>
          <textarea id="paste" value={pasted} onChange={(e) => setPasted(e.target.value)} rows={3} placeholder="IBPREP1:…" className="mt-1 w-full rounded-xl border border-base bg-surface p-3 text-sm font-mono focus-ring" />
          <Button size="sm" className="mt-2" onClick={() => stage(pasted)} disabled={!pasted.trim()}>
            Load code
          </Button>
        </div>

        {pending && (
          <div className="mt-5 rounded-xl border border-accent-200 bg-accent-50 dark:bg-accent-900/20 dark:border-accent-800 p-4 flip-enter">
            <div className="font-semibold">Ready to import</div>
            <p className="text-sm muted mt-1">
              Exported {formatDateTime(pending.exportedAt)} · {Object.keys(pending.progress).length} cards · {pending.bookmarks.length} bookmarks · {Object.keys(pending.deals).length} deals
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button variant="accent" onClick={() => apply('merge')}>
                Merge (recommended)
              </Button>
              <Button variant="danger" onClick={() => apply('overwrite')}>
                Overwrite this device
              </Button>
              <Button variant="ghost" onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
            <p className="text-xs muted mt-3">Merge keeps the most recent review per card, combines bookmarks and saved deals (newest notes win).</p>
          </div>
        )}
      </section>

      {message && <div className={`rounded-xl p-3 text-sm ${message.kind === 'ok' ? 'bg-accent-50 text-accent-800 dark:bg-accent-900/30 dark:text-accent-100' : 'bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-100'}`}>{message.text}</div>}
    </div>
  );
}
