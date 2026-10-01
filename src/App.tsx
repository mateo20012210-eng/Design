import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { StudyPage } from '@/pages/StudyPage';
import { SessionPage } from '@/pages/SessionPage';
import { Onboarding } from '@/components/Onboarding';

// Secondary pages are code-split so the first paint only needs the study shell.
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const CardPage = lazy(() => import('@/pages/CardPage').then((m) => ({ default: m.CardPage })));
const ProgressPage = lazy(() => import('@/pages/ProgressPage').then((m) => ({ default: m.ProgressPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const SyncPage = lazy(() => import('@/pages/SyncPage').then((m) => ({ default: m.SyncPage })));
const PulsePage = lazy(() => import('@/pages/PulsePage').then((m) => ({ default: m.PulsePage })));
const PulseArchivePage = lazy(() => import('@/pages/PulseArchivePage').then((m) => ({ default: m.PulseArchivePage })));
const DealsPage = lazy(() => import('@/pages/DealsPage').then((m) => ({ default: m.DealsPage })));
const DealNotesPage = lazy(() => import('@/pages/DealNotesPage').then((m) => ({ default: m.DealNotesPage })));

function Loading() {
  return <div className="surface h-24 animate-pulse" aria-busy="true" aria-label="Loading" role="status" />;
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Onboarding />
        <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<StudyPage />} />
            <Route path="study" element={<SessionPage />} />
            <Route path="card/:id" element={<CardPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="sync" element={<SyncPage />} />
            <Route path="pulse" element={<PulsePage />} />
            <Route path="pulse/archive" element={<PulseArchivePage />} />
            <Route path="pulse/:week" element={<PulsePage />} />
            <Route path="deals" element={<DealsPage />} />
            <Route path="deals/:id" element={<DealNotesPage />} />
            <Route path="*" element={<StudyPage />} />
          </Route>
        </Routes>
        </Suspense>
      </HashRouter>
    </StoreProvider>
  );
}
