import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { DailyCollections } from './components/DailyCollections';
import { Clients } from './components/Clients';
import { LatePayments } from './components/LatePayments';
import { Loans } from './components/Loans';
import { UsersManager } from './components/UsersManager';
import { Reports } from './components/Reports';
import { BottomNav } from './components/BottomNav';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <LoginPage />;
  }

  // Redirection logic for restricted tabs
  const restrictedTabs = ['users', 'reports', 'loans'];
  if (!isAdmin && restrictedTabs.includes(activeTab)) {
    setActiveTab('dashboard');
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'collections': return <DailyCollections />;
      case 'clients': return <Clients />;
      case 'late': return <LatePayments />;
      case 'loans': return <Loans />;
      case 'users': return <UsersManager />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen-safe flex flex-col lg:flex-row bg-fin-dark text-slate-200 overflow-x-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen-safe relative w-full">
        <TopBar setActiveTab={setActiveTab} />
        
        <div className="flex-1 w-full max-w-[1600px] mx-auto p-[var(--spacing-container)] pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-[var(--spacing-container)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="w-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
