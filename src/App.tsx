import { useState } from 'react';
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

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [theme] = useState<'dark' | 'light'>('dark');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
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
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </Layout>
    </div>
  );
}

export default App;
