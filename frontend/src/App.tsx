import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/Landing/LandingPage';
import { LoginPage } from './pages/Login/LoginPage';
import { SignupPage } from './pages/Signup/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPassword/ForgotPasswordPage';
import { CompleteProfilePage } from './pages/CompleteProfile/CompleteProfilePage';
import { ClientDashboard } from './pages/ClientDashboard/ClientDashboard';
import { CoachDashboard } from './pages/CoachDashboard/CoachDashboard';
import { AdminDashboard } from './pages/AdminDashboard/AdminDashboard';
import { AboutPage } from './pages/About/AboutPage';
import { PrivacyPolicyPage } from './pages/Legal/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/Legal/TermsOfServicePage';
import './styles/global.css';

import { api } from './data/api';
import { navigate, listenToRouteChanges, parseRoute } from './utils/navigation';

interface AppState { 
  page: string; 
  role: 'client' | 'coach' | 'admin' | null; 
  userName: string; 
  profileComplete: boolean; 
  activeGoal: string; 
  profileData?: any; 
}

export function App() {
  const [appState, setAppState] = useState<AppState>({ 
    page: 'landing', 
    role: null, 
    userName: '', 
    profileComplete: false, 
    activeGoal: '' 
  });
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isCheckingAuth, setIsCheckingAuth] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    }

    // Process push notification query parameters if any (?section=...)
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section) {
      let targetPath = '/dashboard';
      if (section === 'my-clients' || section === 'clients') targetPath = '/clients';
      else if (section === 'coach-performance' || section === 'my-coaches') targetPath = '/coaches';
      else if (section === 'prospects') targetPath = '/prospects';
      else if (section === 'referrals' || section === 'my-referrals') targetPath = '/referrals';
      else if (section === 'results' || section === 'coach-results') targetPath = '/results';
      else if (section === 'diet-schedule' || section === 'diet-plan') targetPath = '/diet-plans';
      else if (section === 'client-plans') targetPath = '/client-plans';
      else if (section === 'my-profile') targetPath = '/profile';
      else if (section === 'settings') targetPath = '/settings';
      else if (section === 'progress') targetPath = '/analytics';
      else if (section === 'my-parameters') targetPath = '/my-parameters';

      // Pre-populate history to allow back button to return to dashboard
      if (targetPath !== '/dashboard') {
        window.history.replaceState({ authenticated: true, index: 0 }, '', '/dashboard');
        window.history.pushState({ authenticated: true, index: 1 }, '', targetPath);
      } else {
        window.history.replaceState({ authenticated: true, index: 0 }, '', '/dashboard');
      }
      setCurrentPath(targetPath);
    } else {
      // For deep-links (like /client/123), pre-populate back path if user is authenticated and history has 1 entry
      const initPath = window.location.pathname;
      const isPublic = ['/', '/login', '/signup', '/forgot-password', '/about', '/privacy', '/terms'].includes(initPath);
      if (!isPublic && initPath !== '/dashboard') {
        if (!window.history.state || window.history.state.index === undefined) {
          window.history.replaceState({ authenticated: true, index: 0 }, '', '/dashboard');
          window.history.pushState({ authenticated: true, index: 1 }, '', initPath);
        }
      }
    }

    // Check if token exists, validate session and retrieve user data
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.data) {
            const user = res.data;
            setAppState({
              page: user.role === 'coach' ? 'coach-dashboard' : user.role === 'admin' ? 'admin-dashboard' : 'client-dashboard',
              role: user.role,
              userName: user.name,
              profileComplete: user.profileComplete,
              activeGoal: user.activeGoal || ''
            });

            // Redirect public page visits to dashboard if already authenticated
            const path = window.location.pathname;
            if (['/', '/login', '/signup', '/forgot-password'].includes(path)) {
              navigate('/dashboard', { replace: true });
            }
          } else {
            localStorage.removeItem('token');
            const path = window.location.pathname;
            if (!['/', '/login', '/signup', '/forgot-password', '/about', '/privacy', '/terms'].includes(path)) {
              navigate('/login', { replace: true });
            }
          }
        } catch (err) {
          console.warn('Auth validation failed, clearing token');
          localStorage.removeItem('token');
          const path = window.location.pathname;
          if (!['/', '/login', '/signup', '/forgot-password', '/about', '/privacy', '/terms'].includes(path)) {
            navigate('/login', { replace: true });
          }
        } finally {
          setIsCheckingAuth(false);
        }
      } else {
        setIsCheckingAuth(false);
        const path = window.location.pathname;
        if (!['/', '/login', '/signup', '/forgot-password', '/about', '/privacy', '/terms'].includes(path)) {
          navigate('/login', { replace: true });
        }
      }
    };
    checkAuth();
  }, []);

  // Listen to path changes and sync local path state
  useEffect(() => {
    const unsubscribe = listenToRouteChanges((route) => {
      setCurrentPath(route.pathname);
    });
    return unsubscribe;
  }, []);

  // Sync route path changes with top level React appState
  useEffect(() => {
    if (isCheckingAuth) return;

    const token = localStorage.getItem('token');
    const isAuthenticated = !!token && !!appState.role;
    const isPublicRedirectPath = ['/', '/login', '/signup', '/forgot-password'].includes(currentPath);

    if (isAuthenticated) {
      if (isPublicRedirectPath) {
        // Back navigation loop protection: Exit application
        if (window.history.state && window.history.state.authenticated) {
          window.history.back();
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        const parsed = parseRoute(currentPath, appState.role);
        if (appState.page !== parsed.page) {
          setAppState(prev => ({ ...prev, page: parsed.page }));
        }
      }
    } else {
      const isPrivatePath = !['/', '/login', '/signup', '/forgot-password', '/about', '/privacy', '/terms'].includes(currentPath);
      if (isPrivatePath) {
        navigate('/login', { replace: true });
      } else {
        const parsed = parseRoute(currentPath, null);
        if (appState.page !== parsed.page) {
          setAppState(prev => ({ ...prev, page: parsed.page }));
        }
      }
    }
  }, [currentPath, appState.role, isCheckingAuth]);

  const handleLogin = (role: 'client' | 'coach' | 'admin', name: string, profileComplete: boolean = false, activeGoal: string = '') => {
    setAppState(prev => ({ 
      ...prev, 
      page: role === 'coach' ? 'coach-dashboard' : role === 'admin' ? 'admin-dashboard' : 'client-dashboard', 
      role, 
      userName: name, 
      profileComplete,
      activeGoal
    }));
    navigate('/dashboard', { replace: true });
  };

  const handleProfileComplete = (fullName?: string, activeGoal?: string, data?: any) => {
    setAppState(prev => ({ 
      ...prev, 
      profileComplete: true, 
      userName: fullName || prev.userName, 
      activeGoal: activeGoal || prev.activeGoal, 
      profileData: data, 
      page: prev.role === 'coach' ? 'coach-dashboard' : 'client-dashboard' 
    }));
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = async () => { 
    await api.logout();
    setAppState({ page: 'landing', role: null, userName: '', profileComplete: false, activeGoal: '' }); 
    navigate('/', { replace: true });
  };

  const renderPage = () => {
    switch (appState.page) {
      case 'landing': return <LandingPage onNavigate={navigate} />;
      case 'login': return <LoginPage onNavigate={navigate} onLogin={handleLogin} initialRole={appState.role === 'coach' ? 'coach' : 'client'} />;
      case 'signup': return <SignupPage onNavigate={navigate} />;
      case 'forgot-password': return <ForgotPasswordPage onNavigate={navigate} />;
      case 'complete-profile': return <CompleteProfilePage role={(appState.role as 'client' | 'coach') || 'client'} onComplete={handleProfileComplete} onNavigate={navigate} profileData={appState.profileData} />;
      case 'client-dashboard': return <ClientDashboard userName={appState.userName} onLogout={handleLogout} onNavigateApp={navigate} profileComplete={appState.profileComplete} activeGoal={appState.activeGoal} subscriptionStartDate="2026-06-15" profileData={appState.profileData} />;
      case 'coach-dashboard': return <CoachDashboard userName={appState.userName} onLogout={handleLogout} />;
      case 'admin-dashboard': return <AdminDashboard userName={appState.userName} onLogout={handleLogout} />;
      case 'about': return <AboutPage onNavigate={navigate} />;
      case 'privacy': return <PrivacyPolicyPage onNavigate={navigate} />;
      case 'terms': return <TermsOfServicePage onNavigate={navigate} />;
      default: return <LandingPage onNavigate={navigate} />;
    }
  };

  if (isCheckingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', backgroundColor: 'var(--white)', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--grey-200)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--grey-500)', fontWeight: 500 }}>Initializing NutriCoach...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{renderPage()}</>;
}
