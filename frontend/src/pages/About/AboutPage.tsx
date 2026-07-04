import React, { useEffect } from 'react';
import { Button } from '../../components/Button/Button';
import '../Landing/LandingPage.css';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
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
        <h1>About NutriCoach</h1>
        <p>Empowering individuals and coaches to achieve their highest health potential.</p>
      </section>

      <section style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto', lineHeight: '1.8', color: 'var(--grey-700)' }}>
        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.8rem' }}>Company Overview</h2>
        <p style={{ marginBottom: '2rem' }}>
          NutriCoach is a premier health and wellness platform designed to bridge the gap between expert nutrition coaches and individuals seeking sustainable lifestyle changes. We provide a seamless, integrated environment where personalized nutrition meets advanced progress tracking.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.8rem' }}>Our Mission</h2>
        <p style={{ marginBottom: '2rem' }}>
          Our mission is to democratize access to high-quality nutrition coaching. We believe that everyone deserves personalized guidance to achieve their health goals, supported by intuitive technology that makes tracking progress effortless and motivating.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.8rem' }}>Our Vision</h2>
        <p style={{ marginBottom: '2rem' }}>
          We envision a world where preventative health and proactive wellness are accessible to all. Through NutriCoach, we aim to build the world's most connected community of health-conscious individuals and dedicated professionals, fostering long-term well-being and vitality.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.8rem' }}>What NutriCoach Does</h2>
        <p style={{ marginBottom: '2rem' }}>
          NutriCoach provides a comprehensive ecosystem for health management. For clients, it serves as a daily companion for tracking body metrics, booking sessions, and receiving customized meal plans. For coaches, it acts as a powerful CRM and analytics tool, enabling them to manage clients, monitor detailed progress, and deliver tailored advice at scale.
        </p>

        <h2 style={{ color: 'var(--dark)', marginBottom: '1rem', fontSize: '1.8rem' }}>Our Services</h2>
        <p style={{ marginBottom: '2rem' }}>
          We offer a range of services designed to support your journey:
        </p>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '2rem' }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>Personalized Nutrition Coaching:</strong> Connect with certified coaches who design diet plans tailored to your specific goals and medical history.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Advanced Analytics & Tracking:</strong> Monitor detailed body parameters and measurements over time with interactive graphs.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Seamless Scheduling:</strong> Book one-on-one virtual or in-person sessions with your coach effortlessly.</li>
        </ul>
      </section>

      <footer className="footer" style={{ marginTop: 'auto' }}>
        <div className="footer-container">
          <p className="footer-copyright" style={{ textAlign: 'center' }}>© 2026 NutriCoach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
