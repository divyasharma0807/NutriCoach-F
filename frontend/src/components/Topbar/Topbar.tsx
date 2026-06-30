import React, { useState, useEffect, useRef } from 'react';
import './Topbar.css';

interface TopbarProps { 
  title: string; 
  userName: string; 
  onMenuClick: () => void;
  onNavigateToDietPlan?: () => void;
  onNavigateToProfile?: () => void;
  onNavigate?: (section: string) => void;
  profileComplete?: boolean;
  notifications?: {id: number, text: string, read: boolean}[];
  onMarkAsRead?: (id: number) => void;
  role?: 'client' | 'coach';
}

export const Topbar: React.FC<TopbarProps> = ({ 
  title, userName, onMenuClick, onNavigateToDietPlan, onNavigateToProfile, onNavigate, profileComplete,
  notifications = [], onMarkAsRead, role
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark-theme', newTheme === 'dark');
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    if (onMarkAsRead) onMarkAsRead(id);
  };

  const handleProfileNav = (section: string) => {
    setIsProfileMenuOpen(false);
    if (onNavigate) {
      onNavigate(section);
    }
  };

  const initials = profileComplete && userName ? userName.charAt(0).toUpperCase() : '👤';
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">☰</button>
        <div className="topbar-title-group">
          <h1 className="topbar-title">{title}</h1>
          <span className="topbar-breadcrumb">NutriCoach / {title}</span>
        </div>
      </div>
      <div className="topbar-right">
        <button 
            className="topbar-icon-btn" 
            aria-label="Toggle Theme"
            onClick={toggleTheme}
            style={{ fontSize: '1.2rem', paddingBottom: '2px' }}
          >
            {theme === 'light' ? '☀️' : '🌙'}
          </button>
        <div className="notification-container" ref={notificationRef}>
          <button 
            className="topbar-icon-btn topbar-notification" 
            aria-label="Notifications"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            🔔{unreadCount > 0 && <span className="notification-badge"></span>}
          </button>
          {isNotificationsOpen && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">Notifications</div>
              <div className="notification-dropdown-content" style={{ padding: 0 }}>
                {notifications.filter(n => !n.read).length > 0 ? (
                  notifications.filter(n => !n.read).map(n => (
                    <div key={n.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--grey-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--dark)', whiteSpace: 'pre-line' }}>{n.text}</p>
                      <button onClick={() => markAsRead(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.2rem' }} title="Mark as read">👁️</button>
                    </div>
                  ))
                ) : (
                  <p style={{ padding: '1.5rem 1rem', margin: 0, fontSize: '0.85rem', color: 'var(--grey-500)', textAlign: 'center' }}>No notifications available.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="profile-menu-container" style={{ position: 'relative' }} ref={profileRef}>
          <button className="topbar-avatar" aria-label="User menu" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>{initials}</button>
          {isProfileMenuOpen && (
            <div className="profile-dropdown" style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0, backgroundColor: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '200px', zIndex: 100, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button onClick={() => handleProfileNav('my-profile')} style={{ padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--grey-100)', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--dark)' }}>My Profile</button>
                {role !== 'client' && (
                  <button onClick={() => handleProfileNav('complete-profile')} style={{ padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--grey-100)', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--dark)' }}>Complete Profile</button>
                )}
                <button onClick={() => handleProfileNav('settings')} style={{ padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--grey-100)', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--dark)' }}>Settings</button>
                <button onClick={() => handleProfileNav('logout')} style={{ padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 600 }}>Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
