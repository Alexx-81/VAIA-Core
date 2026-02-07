import { useState, useEffect } from 'react';
import { Logo } from '../Logo';
import { Tabs } from '../Tabs';
import type { TabId } from '../Tabs/types';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  allowedTabs?: TabId[];
}

export const Layout = ({ children, activeTab, onTabChange, allowedTabs }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { employee, isReadOnly, signOut } = useAuth();

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

  const handleSignOut = async () => {
    await signOut();
  };

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
          <div className="layout-header__right">
            {employee && (
              <div className="layout-user">
                <div className="layout-user__avatar">
                  {employee.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="layout-user__name">{employee.full_name}</span>
                <button
                  className="layout-user__logout"
                  onClick={handleSignOut}
                  title="Изход"
                  aria-label="Изход от системата"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            )}
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
        </div>
        <nav className={`layout-nav ${isMenuOpen ? 'layout-nav--open' : ''}`}>
          <button 
            className="layout-nav__close"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
          <Tabs activeTab={activeTab} onTabChange={handleTabChange} allowedTabs={allowedTabs} />
        </nav>
      </header>
      <main className="layout-main">
        {isReadOnly && (
          <div className="layout-demo-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Демо режим — разглеждане без възможност за промени</span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};
