import { useState, useEffect } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when tab changes
  const handleTabChange = (tabId: TabId) => {
    onTabChange(tabId);
    setIsMenuOpen(false);
  };

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <div className="layout">
      {/* Overlay must be before nav in DOM for proper stacking */}
      {isMenuOpen && (
        <div 
          className="layout-overlay" 
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <header className="layout-header">
        <div className="layout-header__top">
          <Logo />
          <button 
            className={`hamburger ${isMenuOpen ? 'hamburger--active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger__line"></span>
            <span className="hamburger__line"></span>
            <span className="hamburger__line"></span>
          </button>
        </div>
        <nav className={`layout-nav ${isMenuOpen ? 'layout-nav--open' : ''}`}>
          <button 
            className="layout-nav__close"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
          <Tabs activeTab={activeTab} onTabChange={handleTabChange} />
        </nav>
      </header>
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
};
