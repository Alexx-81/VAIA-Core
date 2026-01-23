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
import type { TabId } from './shared/components/Tabs';
import './App.css';

const validTabs: TabId[] = ['dashboard', 'qualities', 'articles', 'deliveries', 'sales', 'inventory', 'reports', 'settings'];

function getTabFromUrl(): TabId {
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  return validTabs.includes(path as TabId) ? (path as TabId) : 'dashboard';
}

function App() {
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

  const renderContent = () => {
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
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`app theme-${theme}`}>
      <Layout activeTab={activeTab} onTabChange={handleTabChange}>
        {renderContent()}
      </Layout>
    </div>
  );
}

export default App;
