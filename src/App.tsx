import { HashRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { StudyPage } from '@/pages/StudyPage';
import { SessionPage } from '@/pages/SessionPage';
import { SearchPage } from '@/pages/SearchPage';
import { CardPage } from '@/pages/CardPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SyncPage } from '@/pages/SyncPage';
import { PulsePage } from '@/pages/PulsePage';
import { PulseArchivePage } from '@/pages/PulseArchivePage';
import { DealsPage } from '@/pages/DealsPage';
import { DealNotesPage } from '@/pages/DealNotesPage';
import { Onboarding } from '@/components/Onboarding';

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Onboarding />
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
      </HashRouter>
    </StoreProvider>
  );
}
