import React, { useEffect } from 'react';
import { Button } from '../../components/Button/Button';
import '../Landing/LandingPage.css';

interface PrivacyPolicyPageProps {
  onNavigate: (page: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page page-enter">
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo" onClick={() => onNavigate('landing')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">🌿</span><span className="logo-text">NutriCoach</span>
          </div>
          <div className="navbar-links">
            <button onClick={() => onNavigate('landing')}>Home</button>
          </div>
          <div className="navbar-actions">
            <Button variant="secondary" size="sm" onClick={() => onNavigate('login')}>Log In</Button>
          </div>
        </div>
      </nav>

      <section className="page-hero">
        <h1>Privacy Policy</h1>
        <p>How we collect, use, and protect your information.</p>
      </section>

      <section style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto', lineHeight: '1.8', color: 'var(--grey-700)' }}>
        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.5rem' }}>1. Information Collection</h2>
        <p style={{ marginBottom: '2rem' }}>
          When you use NutriCoach, we collect personal information that you provide to us, including your name, email address, phone number, and physical characteristics (such as weight, height, and body measurements). We also collect data regarding your health goals, dietary preferences, and session schedules.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.5rem' }}>2. Data Usage</h2>
        <p style={{ marginBottom: '2rem' }}>
          The information we collect is strictly used to provide and improve our nutrition coaching services. Your data allows certified coaches to tailor diet plans, monitor your fitness progress, and manage session bookings effectively. We do not sell your personal health data to third parties.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.5rem' }}>3. Security</h2>
        <p style={{ marginBottom: '2rem' }}>
          Protecting your health data is our top priority. NutriCoach employs industry-standard encryption, secure server hosting, and strict access controls to safeguard your personal and sensitive information against unauthorized access, alteration, or disclosure.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.5rem' }}>4. User Rights</h2>
        <p style={{ marginBottom: '2rem' }}>
          You maintain full ownership of your personal data. You have the right to access, update, export, or permanently delete your profile and associated health tracking information at any time. If you wish to exercise these rights, please contact our support team.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.5rem' }}>5. Contact Information</h2>
        <p style={{ marginBottom: '2rem' }}>
          If you have any questions or concerns regarding this Privacy Policy or how your data is handled, please contact us at:<br/>
          <strong>Email:</strong> egauravsharma@gmail.com<br/>
          <strong>Phone:</strong> +91 8818999958
        </p>
      </section>

      <footer className="footer" style={{ marginTop: 'auto' }}>
        <div className="footer-container">
          <p className="footer-copyright" style={{ textAlign: 'center' }}>© 2026 NutriCoach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
