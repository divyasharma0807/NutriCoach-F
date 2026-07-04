import React, { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { InputField } from '../../components/InputField/InputField';
import './ForgotPasswordPage.css';

interface ForgotPasswordPageProps { onNavigate: (page: string) => void; }

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="forgot-page page-enter">
      <div className="forgot-left-panel">
        <div className="forgot-logo"><span className="logo-icon">🌿</span><span className="logo-text">NutriCoach</span></div>
        <div className="forgot-content">
          <h2>Your Health Journey Starts Here</h2>
          <p>Connect with certified coaches, track your progress, and achieve your wellness goals with personalized support.</p>
          <div className="forgot-features">
            {['Personalized diet plans', 'Real-time progress tracking', 'Expert coach guidance', 'Secure medical records'].map(f => (
              <div key={f} className="forgot-feature-item"><div className="forgot-feature-icon">✓</div><span>{f}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="forgot-right-panel">
        <div className="forgot-form-card">
          <button className="back-link" onClick={() => onNavigate('login')}>← Back to Login</button>
          {!sent ? (
            <>
              <div className="forgot-icon-circle">🔐</div>
              <h2>Reset Your Password</h2>
              <p className="forgot-subtitle">Enter your email address and we'll send you a link to reset your password.</p>
              <form onSubmit={handleSubmit}>
                <InputField label="Email Address" type="email" placeholder="your@email.com" value={email} onChange={setEmail} required />
                <Button variant="primary" fullWidth type="submit">Send Reset Link →</Button>
              </form>
            </>
          ) : (
            <div className="forgot-success">
              <div className="success-circle">
                <svg viewBox="0 0 52 52" className="checkmark-svg">
                  <circle cx="26" cy="26" r="25" fill="var(--green-pale)" />
                  <path fill="none" stroke="var(--green)" strokeWidth="3" d="M14 27l7 7 16-16" className="checkmark-path" />
                </svg>
              </div>
              <h3>Check Your Email!</h3>
              <p className="success-subtitle">We've sent a password reset link to your email address. Please check your inbox and spam folder.</p>
              <div className="success-info-box">💡 The link expires in 24 hours</div>
              <div className="success-links">
                <button onClick={() => setSent(false)}>Didn't receive it? Resend email</button>
                <button onClick={() => onNavigate('login')}>← Back to Login</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
