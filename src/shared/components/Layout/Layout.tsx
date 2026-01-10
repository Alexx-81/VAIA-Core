import { Logo } from '../Logo';
import { Tabs } from '../Tabs';
import type { TabId } from '../Tabs/types';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export const Layout = ({ children, activeTab, onTabChange }: LayoutProps) => {
  return (
    <div className="layout">
      <header className="layout-header">
        <Logo />
        <Tabs activeTab={activeTab} onTabChange={onTabChange} />
      </header>
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
};
