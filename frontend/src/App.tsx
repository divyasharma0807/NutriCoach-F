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

interface AppState { page: string; role: 'client' | 'coach' | 'admin' | null; userName: string; profileComplete: boolean; activeGoal: string; profileData?: any; }

import { api } from './data/api';

export function App() {
  const [appState, setAppState] = useState<AppState>({ page: 'landing', role: null, userName: '', profileComplete: false, activeGoal: '' });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    }
    
    // Check if token exists, try to get user info
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
          }
        } catch (err) {
          console.warn('Auth validation failed, clearing token');
          localStorage.removeItem('token');
        }
      }
    };
    checkAuth();
  }, []);

  const navigate = (page: string) => { 
    if (page === 'login-coach') {
      setAppState(prev => ({ ...prev, page: 'login', role: 'coach' }));
    } else {
      setAppState(prev => ({ ...prev, page })); 
    }
    window.scrollTo(0, 0); 
  };

  const handleLogin = (role: 'client' | 'coach' | 'admin', name: string, profileComplete: boolean = false, activeGoal: string = '') => {
    setAppState(prev => ({ 
      ...prev, 
      page: role === 'coach' ? 'coach-dashboard' : role === 'admin' ? 'admin-dashboard' : 'client-dashboard', 
      role, 
      userName: name, 
      profileComplete,
      activeGoal
    }));
  };

  const handleProfileComplete = (fullName?: string, activeGoal?: string, data?: any) => {
    setAppState(prev => ({ ...prev, profileComplete: true, userName: fullName || prev.userName, activeGoal: activeGoal || prev.activeGoal, profileData: data, page: prev.role === 'coach' ? 'coach-dashboard' : 'client-dashboard' }));
  };

  const handleLogout = async () => { 
    await api.logout();
    setAppState({ page: 'landing', role: null, userName: '', profileComplete: false, activeGoal: '' }); 
  };

  const renderPage = () => {
    switch (appState.page) {
      case 'landing': return <LandingPage onNavigate={navigate} />;
      case 'login': return <LoginPage onNavigate={navigate} onLogin={handleLogin} initialRole={appState.role === 'coach' ? 'coach' : 'client'} />;
      case 'signup': return <SignupPage onNavigate={navigate} />;
      case 'forgot-password': return <ForgotPasswordPage onNavigate={navigate} />;
      case 'complete-profile': return <CompleteProfilePage role={(appState.role as 'client' | 'coach') || 'client'} onComplete={handleProfileComplete} onNavigate={navigate} />;
      case 'client-dashboard': return <ClientDashboard userName={appState.userName} onLogout={handleLogout} onNavigateApp={navigate} profileComplete={appState.profileComplete} activeGoal={appState.activeGoal} subscriptionStartDate="2026-06-15" profileData={appState.profileData} />;
      case 'coach-dashboard': return <CoachDashboard userName={appState.userName} onLogout={handleLogout} />;
      case 'admin-dashboard': return <AdminDashboard userName={appState.userName} onLogout={handleLogout} />;
      case 'about': return <AboutPage onNavigate={navigate} />;
      case 'privacy': return <PrivacyPolicyPage onNavigate={navigate} />;
      case 'terms': return <TermsOfServicePage onNavigate={navigate} />;
      default: return <LandingPage onNavigate={navigate} />;
    }
  };

  return <>{renderPage()}</>;
}
