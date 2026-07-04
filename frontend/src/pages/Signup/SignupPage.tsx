import React, { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { InputField } from '../../components/InputField/InputField';
import './SignupPage.css';

import { api } from '../../data/api';

interface SignupPageProps { onNavigate: (page: string) => void; }

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
  const [role, setRole] = useState<'client' | 'coach'>('client');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await api.register(fullName, email, password, role);
      if (res.success) {
        onNavigate('complete-profile');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="signup-page page-enter">
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
      <div className="signup-left-panel">
        <div className="signup-logo"><span className="logo-icon">🌿</span><span className="logo-text">NutriCoach</span></div>
        <div className="signup-content">
          <h2>Your Health Journey Starts Here</h2>
          <p>Connect with certified coaches, track your progress, and achieve your wellness goals with personalized support.</p>
          <div className="signup-features">
            {['Personalized diet plans', 'Real-time progress tracking', 'Expert coach guidance', 'Secure medical records'].map(f => (
              <div key={f} className="signup-feature-item"><div className="signup-feature-icon">✓</div><span>{f}</span></div>
            ))}
          </div>
        </div>
        <div className="signup-footer">
          <span>Already have an account?</span>
          <button className="signup-link" onClick={() => onNavigate('login')}>Sign in</button>
        </div>
      </div>
      <div className="signup-right-panel">
        <div className="signup-form-card">
          <h2>Create Your Account</h2>
          <p className="signup-subtitle">Start your health journey today</p>
          <div className="role-selector">
            <button className={`role-card ${role === 'client' ? 'selected' : ''}`} onClick={() => setRole('client')}>
              <span className="role-emoji">👤</span><span className="role-title">CLIENT</span><span className="role-description">I want to get healthier</span>
            </button>
            <button className={`role-card ${role === 'coach' ? 'selected' : ''}`} onClick={() => setRole('coach')}>
              <span className="role-emoji">🏋️</span><span className="role-title">COACH</span><span className="role-description">I guide others to wellness</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <InputField label="Full Name" type="text" placeholder="John Doe" value={fullName} onChange={setFullName} required />
              <InputField label="Email Address" type="email" placeholder="john@example.com" value={email} onChange={setEmail} required />
            </div>
            <div className="form-row">
              <InputField label="Password" type="password" placeholder="Min. 8 characters" value={password} onChange={setPassword} required />
              <InputField label="Confirm Password" type="password" placeholder="Repeat password" value={confirmPassword} onChange={setConfirmPassword} required />
            </div>
            <div className="terms-checkbox">
              <input type="checkbox" id="terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
              <label htmlFor="terms">I agree to the <button type="button" className="terms-link">Terms of Service</button> and <button type="button" className="terms-link">Privacy Policy</button></label>
            </div>
            <Button variant="primary" fullWidth type="submit" disabled={!agreeTerms}>Create Account →</Button>
          </form>
          <div className="signup-login-link">Already have an account? <button onClick={() => onNavigate('login')}>Sign in</button></div>
        </div>
      </div>
    </div>
  );
};
