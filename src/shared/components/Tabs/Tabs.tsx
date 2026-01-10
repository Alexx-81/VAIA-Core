import { tabs } from './tabsConfig';
import type { TabId } from './types';
import './Tabs.css';

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export const Tabs = ({ activeTab, onTabChange }: TabsProps) => {
  return (
    <nav className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};
