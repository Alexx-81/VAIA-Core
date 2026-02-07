import { tabs } from './tabsConfig';
import type { TabId } from './types';
import './Tabs.css';

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  allowedTabs?: TabId[];
}

export const Tabs = ({ activeTab, onTabChange, allowedTabs }: TabsProps) => {
  const handleClick = (tabId: TabId) => {
    console.log('Tab clicked:', tabId);
    onTabChange(tabId);
  };

  const visibleTabs = allowedTabs
    ? tabs.filter(tab => allowedTabs.includes(tab.id))
    : tabs;

  return (
    <div className="tabs">
      {visibleTabs.map((tab) => (
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
