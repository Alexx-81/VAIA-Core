import { tabs } from './tabsConfig';
import type { TabId } from './types';
import './Tabs.css';

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export const Tabs = ({ activeTab, onTabChange }: TabsProps) => {
  const handleClick = (tabId: TabId) => {
    console.log('Tab clicked:', tabId);
    onTabChange(tabId);
  };

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
          onClick={() => handleClick(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
