import React, { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { InputField } from '../../components/InputField/InputField';
import './LoginPage.css';

import { api } from '../../data/api';

interface LoginPageProps { onNavigate: (page: string) => void; onLogin: (role: 'client' | 'coach' | 'admin', name: string, profileComplete?: boolean, activeGoal?: string) => void; initialRole?: 'client' | 'coach' | 'admin'; }

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLogin, initialRole }) => {
  const [role, setRole] = useState<'client' | 'coach' | 'admin'>(initialRole || 'client');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.login(mobileNumber, password, role);
      if (res.success && res.data) {
        onLogin(role, res.data.name, res.data.profileComplete, res.data.activeGoal);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <div className="login-page page-enter">
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#fee2e2',
          color: '#ef4444',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          zIndex: 1000,
          fontSize: '0.9rem',
          borderLeft: '4px solid #ef4444'
        }}>
          ⚠️ {error}
        </div>
      )}
      <div className="login-left-panel">
        <div className="login-logo"><span className="logo-icon">🌿</span><span className="logo-text">NutriCoach</span></div>
        <div className="login-content">
          <h2>Your Health Journey Starts Here</h2>
          <p>Connect with certified coaches, track your progress, and achieve your wellness goals with personalized support.</p>
          <div className="login-features">
            {['Personalized diet plans', 'Real-time progress tracking', 'Expert coach guidance', 'Secure medical records'].map(f => (
              <div key={f} className="login-feature-item"><div className="login-feature-icon">✓</div><span>{f}</span></div>
            ))}
          </div>
        </div>
        <div className="login-footer">
          <span>Need help? Contact support</span>
        </div>
      </div>
      <div className="login-right-panel">
        <div className="login-form-card">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to your NutriCoach account</p>
          <div className="role-toggle">
            <button className={`role-toggle-btn ${role === 'client' ? 'active' : ''}`} onClick={() => setRole('client')}>👤 Client</button>
            <button className={`role-toggle-btn ${role === 'coach' ? 'active' : ''}`} onClick={() => setRole('coach')}>🤝 Coach</button>
            <button className={`role-toggle-btn ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>🛡️ Admin</button>
          </div>
          <form onSubmit={handleSubmit}>
            <InputField label="Mobile Number" type="text" placeholder="+91" value={mobileNumber} onChange={setMobileNumber} required />
            <InputField label="Password" type="password" placeholder="Enter your password" value={password} onChange={setPassword} required />
            <div style={{ marginTop: '1.5rem' }}>
              <Button variant="primary" fullWidth type="submit">Login as {role.charAt(0).toUpperCase() + role.slice(1)}</Button>
            </div>
          </form>
          <div style={{ marginTop: '2rem' }}>
            <p className="login-terms">By logging in you agree to our <button>Terms of Service</button> and <button>Privacy Policy</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};
