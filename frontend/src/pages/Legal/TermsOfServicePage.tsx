import React, { useEffect } from 'react';
import { Button } from '../../components/Button/Button';
import '../Landing/LandingPage.css';

interface TermsOfServicePageProps {
  onNavigate: (page: string) => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onNavigate }) => {
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
        <h1>Terms of Service</h1>
        <p>Rules and regulations for using NutriCoach.</p>
      </section>

      <section style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto', lineHeight: '1.8', color: 'var(--grey-700)' }}>
        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.5rem' }}>1. User Responsibilities</h2>
        <p style={{ marginBottom: '2rem' }}>
          By using NutriCoach, you agree to provide accurate, current, and complete information regarding your health and physical metrics. The guidance provided by coaches on our platform is meant to support, not replace, professional medical advice. You are responsible for consulting a physician before beginning any new diet or fitness program.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.5rem' }}>2. Account Usage</h2>
        <p style={{ marginBottom: '2rem' }}>
          Your NutriCoach account is for personal use only. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Coaches must maintain professional standards and strictly adhere to client confidentiality agreements.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.5rem' }}>3. Session Bookings</h2>
        <p style={{ marginBottom: '2rem' }}>
          All coaching sessions must be booked through the NutriCoach platform. Users are expected to attend scheduled sessions promptly. Cancellations or rescheduling must be done in accordance with the coach's individual cancellation policy, as failure to do so may result in a forfeit of the session.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.5rem' }}>4. Limitations</h2>
        <p style={{ marginBottom: '2rem' }}>
          NutriCoach is an administrative and communicative tool. We do not guarantee specific health outcomes or weight loss results. The platform and its administrators are not liable for any personal injury, dietary complications, or other damages resulting from the use of advice given by independent coaches.
        </p>
        
        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.5rem' }}>5. Service Availability</h2>
        <p style={{ marginBottom: '2rem' }}>
          We strive to keep the NutriCoach platform accessible 24/7. However, we may occasionally suspend or restrict access to the application for necessary maintenance, updates, or technical issues. We are not liable for any disruptions in service.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.5rem' }}>6. Contact Information</h2>
        <p style={{ marginBottom: '2rem' }}>
          If you have any questions or concerns regarding these Terms of Service, please reach out to our team:<br/>
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
