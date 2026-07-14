import React, { useEffect, useState, useRef } from 'react';
import { Button } from '../../components/Button/Button';
import './LandingPage.css';

interface LandingPageProps { onNavigate: (page: string) => void; }

const features = [
  { icon: '🥗', bgColor: 'var(--green-pale)', title: 'Diet Management', description: 'Personalized nutrition plans crafted by certified coaches tailored to your health goals and dietary preferences.' },
  { icon: '📅', bgColor: 'var(--blue-pale)', title: 'Appointment Scheduling', description: 'Seamlessly book 1-on-1 consultations with your coach. Smart time-slot management keeps everything organized.' },
  { icon: '📈', bgColor: '#EDE7F6', title: 'Progress Tracking', description: 'Monitor weight, BMI, body measurements, and daily compliance with beautiful visual charts.' },
  { icon: '📊', bgColor: '#FFF3E0', title: 'Analytics Dashboard', description: 'Detailed insights into your health journey with filterable date ranges and exportable reports.' },
  { icon: '💬', bgColor: '#FCE4EC', title: 'Coach Messaging', description: 'Stay connected with your coach through direct messaging and broadcast notifications.' },
  { icon: '📋', bgColor: '#E0F2F1', title: 'Medical Record Storage', description: 'Securely upload and manage medical reports, lab results, and progress photos in one place.' },
];

const testimonials = [
  { quote: 'NutriCoach completely transformed how I eat. Lost 12kg in 3 months!', author: 'Priya S.', role: 'Client' },
  { quote: 'Managing my clients has never been easier. The platform is seamless.', author: 'Coach Rahul M.', role: 'Coach' },
  { quote: 'The diet plans are so detailed and my energy levels are incredible.', author: 'Arjun K.', role: 'Client' },
];

const steps = [
  { number: '01', title: 'Enter Your Profile', description: 'Sign in to your profile as a client, enter your health details, and get matched with expert coaches.' },
  { number: '02', title: 'Get Your Plan', description: 'Your coach designs a personalized diet plan and schedules your first consultation.' },
  { number: '03', title: 'Track & Improve', description: 'Log daily progress, attend appointments, and watch your health transform over time.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const currentTheme = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark-theme', newTheme === 'dark');
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    featureRefs.current.forEach(ref => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (section: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(section);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page page-enter">
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="logo-icon">🌿</span><span className="logo-text">NutriCoach</span>
          </div>
          <div className="navbar-links">
            <button onClick={() => handleNavClick('features')}>Features</button>
            <button onClick={() => handleNavClick('how-it-works')}>How It Works</button>
          </div>
          <div className="navbar-actions-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              onClick={toggleTheme} 
              className="theme-toggle-btn"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <div className="navbar-actions">
              <Button variant="secondary" size="sm" onClick={() => onNavigate('login')}>Log In</Button>
            </div>
            <button className="navbar-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? '✕' : '☰'}</button>
          </div>
        </div>
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <button onClick={() => handleNavClick('features')}>Features</button>
          <button onClick={() => handleNavClick('how-it-works')}>How It Works</button>
          <Button variant="secondary" fullWidth onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }}>Log In</Button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="fade-in" style={{ animationDelay: '0.1s' }}>Transform Health</span>
              <span className="fade-in" style={{ animationDelay: '0.15s' }}>Through</span>
              <span className="fade-in" style={{ animationDelay: '0.2s' }}>Personalized</span>
              <span className="hero-title-highlight fade-in" style={{ animationDelay: '0.25s' }}>Coaching</span>
            </h1>
            <p className="hero-subtitle fade-in" style={{ animationDelay: '0.3s' }}>Track progress, manage diet plans, schedule consultations, and stay connected with your coach — all in one beautiful platform.</p>
            <div className="hero-cta fade-in" style={{ animationDelay: '0.35s' }}>
              <Button variant="primary" size="lg" onClick={() => onNavigate('login')}>Get Started Free →</Button>
              <Button variant="secondary" size="lg" onClick={() => handleNavClick('features')}>Learn More ›</Button>
            </div>
            <div className="hero-trust fade-in" style={{ animationDelay: '0.4s' }}>✓ Free to join  ✓ No credit card  ✓ Cancel anytime</div>
          </div>
          <div className="hero-image">
            <div className="hero-image-placeholder"><span>🌿</span></div>
          </div>
        </div>
      </section>


      <section className="features-section" id="features">
        <div className="features-container">
          <div className="features-intro">
            <div className="section-pill">Features</div>
            <h2 className="features-title">Everything You Need to Thrive</h2>
            <p className="features-subtitle">A complete toolkit for coaches and clients to build healthier habits, track progress, and achieve lasting results.</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={feature.title} className="feature-card reveal" style={{ animationDelay: `${index * 0.1}s` }} ref={el => { featureRefs.current[index] = el; }}>
                <div className="feature-icon" style={{ backgroundColor: feature.bgColor }}>{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <button className="feature-link" onClick={() => onNavigate('login')}>Learn more ›</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <div className="how-container">
          <div className="how-content">
            <div className="section-pill">How It Works</div>
            <h2 className="how-title">Your Journey to Better Health Starts Here</h2>
            <div className="steps-list">
              {steps.map((step, index) => (
                <div key={step.number} className={`step-item ${index < steps.length - 1 ? 'has-connector' : ''}`}>
                  <div className="step-circle">{step.number}</div>
                  <div className="step-content"><h4 className="step-title">{step.title}</h4><p className="step-description">{step.description}</p></div>
                </div>
              ))}
            </div>
            <div className="how-buttons">
              <Button variant="secondary" onClick={() => onNavigate('login-coach')}>Join as Coach</Button>
              <Button variant="primary" onClick={() => onNavigate('login')}>Start as Client</Button>
            </div>
          </div>
          <div className="how-image"><div className="how-image-placeholder"><span>🌿</span></div></div>
        </div>
      </section>

      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="section-pill">What They Say</div>
          <h2 className="testimonials-title">Real Results, Real People</h2>
          <div className="testimonials-grid">
            {testimonials.map(t => (
              <div key={t.author} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.author.charAt(0)}</div>
                  <div className="testimonial-info"><span className="testimonial-name">{t.author}</span><span className="testimonial-role">{t.role}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <h2 className="cta-title">Ready to Transform Your Health?</h2>
        <p className="cta-subtitle">Join thousands of clients and coaches already on NutriCoach.</p>
        <div className="cta-buttons">
          <Button variant="green" size="lg" onClick={() => onNavigate('login')}>Get Started Free</Button>
          <Button variant="secondary" size="lg">Learn More</Button>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo"><span className="logo-icon">🌿</span><span className="logo-text">NutriCoach</span></div>
              <p className="footer-tagline">Your health journey starts here.</p>
              <div className="footer-social-links">
                <a href="https://www.facebook.com/share/1BUKKzX1ge/" target="_blank" rel="noopener noreferrer" title="Facebook" className="footer-social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>
                </a>
                <a href="https://www.instagram.com/gaurav.healthcoach?igsh=aTM5eDhndHh3eWFu" target="_blank" rel="noopener noreferrer" title="Instagram" className="footer-social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.4 5.6 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.6 18.4 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25zM12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
                </a>
                <a href="https://www.linkedin.com/in/fit-gaurav-1bb7272b/" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="footer-social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                </a>
                <a href="https://www.youtube.com/@egauravsharma" target="_blank" rel="noopener noreferrer" title="YouTube" className="footer-social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
              <p className="footer-copyright">© 2026 NutriCoach. All rights reserved.</p>
            </div>
            <div className="footer-links"><h4>Product</h4><a href="#features">Diet Plans</a><a href="#features">Progress Tracking</a><a href="#features">Scheduling</a><a href="#features">Analytics</a></div>
            <div className="footer-links"><h4>Company</h4><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('about'); }}>About</a></div>
            <div className="footer-links"><h4>Legal</h4><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}>Privacy Policy</a><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}>Terms of Service</a></div>
            <div className="footer-links">
              <h4>Contact</h4>
              <div style={{ color: 'var(--grey-700)', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>Gaurav Sharma</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--grey-600)', fontSize: '0.95rem' }}><span style={{ fontSize: '1.1rem' }}>📞</span> +91 8818999958</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--grey-600)', fontSize: '0.95rem' }}><span style={{ fontSize: '1.1rem' }}>✉️</span> egauravsharma@gmail.com</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
