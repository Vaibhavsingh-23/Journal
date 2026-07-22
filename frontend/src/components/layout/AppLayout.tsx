import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NewEntryModal } from '@/components/common/NewEntryModal';
import { GlobalSearchModal } from '@/components/common/GlobalSearchModal';
import { useJournalModalStore } from '@/stores/journalModalStore';
import { useSearchModalStore } from '@/stores/searchModalStore';

export function AppLayout() {
  const openWriteModal = useJournalModalStore((s) => s.openModal);
  const openSearchModal = useSearchModalStore((s) => s.openModal);

  // Attach global keyboard listeners for Cmd+N and Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+N or Ctrl+N (New Entry)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openWriteModal();
      }
      // Check for Cmd+K or Ctrl+K (Search)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearchModal();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [openWriteModal, openSearchModal]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Sidebar />
      <div className="pl-[240px] transition-all duration-200">
        <TopBar />
        <main className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
      <NewEntryModal />
      <GlobalSearchModal />
    </div>
  );
}
