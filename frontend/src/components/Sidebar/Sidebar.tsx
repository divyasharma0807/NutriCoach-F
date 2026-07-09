import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  role: 'client' | 'coach' | 'admin';
  currentSection: string;
  onNavigate: (section: string) => void;
  userName: string;
  onClose?: () => void;
  isOpen?: boolean;
  profileComplete?: boolean;
}

const clientNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'my-profile', label: 'My Profile', icon: '👤' },
  { id: 'diet-plan', label: 'My Diet Plan', icon: '🥗' },
  { id: 'progress', label: 'Progress & Analytics', icon: '📊' },
  { id: 'my-parameters', label: 'My Parameters', icon: '📏' },
  { id: 'my-referrals', label: 'My Referrals', icon: '🎁' },
  { id: 'coach-results', label: 'Coach Results', icon: '🔍' },
];

const coachNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'my-clients', label: 'My Clients', icon: '👥' },
  { id: 'my-coaches', label: 'My Coaches', icon: '👥' },
  { id: 'prospects', label: 'Prospects', icon: '👥' },
  { id: 'referrals', label: 'Referrals', icon: '🎁' },
  { id: 'results', label: 'Results', icon: '🔍' },
  { id: 'diet-schedule', label: 'Diet Schedule', icon: '📋' },
  { id: 'client-plans', label: 'Client Plans', icon: '📋' },
];

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'coach-performance', label: 'My Coaches', icon: '👥' },
  { id: 'my-clients', label: 'My Clients', icon: '👥' },
  { id: 'prospects', label: 'Prospects', icon: '👥' },
  { id: 'referrals', label: 'Referrals', icon: '🎁' },
  { id: 'results', label: 'Results', icon: '🔍' },
  { id: 'diet-schedule', label: 'Diet Schedule', icon: '📋' },
  { id: 'client-plans', label: 'Client Plans', icon: '📋' },
];

export const Sidebar: React.FC<SidebarProps> = ({ role, currentSection, onNavigate, userName, onClose, isOpen = true, profileComplete = false }) => {
  const dynamicClientNavItems = clientNavItems.map(item => {
    if (item.id === 'my-profile' && !profileComplete) {
      return { id: 'complete-profile', label: 'Complete Profile', icon: '📝' };
    }
    return item;
  });
  
  const navItems = role === 'admin' ? adminNavItems : role === 'client' ? dynamicClientNavItems : coachNavItems;
  const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const handleNavClick = (section: string) => {
    onNavigate(section);
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} role="navigation">
        <div className="sidebar-header">
          <div className="sidebar-logo"><span className="logo-icon">🌿</span><span className="logo-text">NutriCoach</span></div>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-name">{userName || 'User'}</div>
            <div className="sidebar-user-role">{role.toUpperCase()}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">MENU</div>
          {navItems.map(item => (
            <button key={item.id} className={`sidebar-nav-item ${currentSection === item.id ? 'active' : ''}`} onClick={() => handleNavClick(item.id)}>
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-text">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-version">NutriCoach v1.0</div>
        </div>
      </aside>
    </>
  );
};
