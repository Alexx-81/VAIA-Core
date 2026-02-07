import { useState, useEffect, useCallback } from 'react';
import { Layout } from './shared/components/Layout';
import { Dashboard } from './features/dashboard';
import { Qualities } from './features/qualities';
import { Articles } from './features/articles';
import { Deliveries } from './features/deliveries';
import { Sales } from './features/sales';
import { Inventory } from './features/inventory';
import { Reports } from './features/reports';
import { Settings } from './features/settings';
import { Admin } from './features/admin';
import { LoginPage } from './features/auth';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import type { TabId } from './shared/components/Tabs';
import './App.css';

const allTabs: TabId[] = ['dashboard', 'qualities', 'articles', 'deliveries', 'sales', 'inventory', 'reports', 'settings', 'admin'];

function getTabFromUrl(): TabId {
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  return allTabs.includes(path as TabId) ? (path as TabId) : 'dashboard';
}

function AppContent() {
  const { user, employee, permissions, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromUrl);
  const [theme] = useState<'dark' | 'light'>('dark');

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    const newPath = tab === 'dashboard' ? '/' : `/${tab}`;
    window.history.pushState({ tab }, '', newPath);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const tab = event.state?.tab || getTabFromUrl();
      setActiveTab(tab);
    };

    window.addEventListener('popstate', handlePopState);

    // Set initial state if not already set
    const currentTab = getTabFromUrl();
    const newPath = currentTab === 'dashboard' ? '/' : `/${currentTab}`;
    window.history.replaceState({ tab: currentTab }, '', newPath);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Redirect to allowed tab if current tab is not accessible
  useEffect(() => {
    if (!loading && user && employee && permissions.length > 0) {
      if (!permissions.includes(activeTab)) {
        const firstAllowed = permissions[0] || 'dashboard';
        handleTabChange(firstAllowed);
      }
    }
  }, [loading, user, employee, permissions, activeTab, handleTabChange]);

  // Loading state
  if (loading) {
    return (
      <div className={`app theme-${theme}`}>
        <div className="app-loading">
          <div className="app-loading__spinner" />
          <span>Зареждане...</span>
        </div>
      </div>
    );
  }

  // Not authenticated — show login
  if (!user || !employee) {
    return (
      <div className={`app theme-${theme}`}>
        <LoginPage />
      </div>
    );
  }

  const renderContent = () => {
    // Check permission (admins bypass)
    if (!isAdmin && !permissions.includes(activeTab)) {
      return (
        <div className="app-no-access">
          <h2>Нямате достъп</h2>
          <p>Свържете се с администратора за достъп до тази страница.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={handleTabChange} />;
      case 'qualities':
        return <Qualities />;
      case 'articles':
        return <Articles />;
      case 'deliveries':
        return <Deliveries />;
      case 'sales':
        return <Sales />;
      case 'inventory':
        return <Inventory />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'admin':
        return isAdmin ? <Admin /> : (
          <div className="app-no-access">
            <h2>Нямате достъп</h2>
            <p>Само администраторите имат достъп до тази страница.</p>
          </div>
        );
      default:
        return <Dashboard onTabChange={handleTabChange} />;
    }
  };

  return (
    <div className={`app theme-${theme}`}>
      <Layout activeTab={activeTab} onTabChange={handleTabChange} allowedTabs={permissions}>
        {renderContent()}
      </Layout>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
