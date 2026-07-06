import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { Topbar } from '../../components/Topbar/Topbar';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { Button } from '../../components/Button/Button';
import { Modal } from '../../components/Modal/Modal';
import { Toggle } from '../../components/Toggle/Toggle';
import './CoachDashboard.css';
import { api } from '../../data/api';

const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};



const isDateTimeInPast = (dateStr: string, timeStr: string): boolean => {
  if (!dateStr || !timeStr) return false;
  const dateParts = dateStr.split('-');
  if (dateParts.length !== 3) return false;
  const [selYear, selMonth, selDay] = dateParts.map(Number);

  const timeParts = timeStr.split(' ');
  if (timeParts.length !== 2) return false;
  const [timeVal, modifier] = timeParts;
  const hmParts = timeVal.split(':');
  if (hmParts.length !== 2) return false;
  let [selHours, selMinutes] = hmParts.map(Number);

  if (modifier === 'PM' && selHours < 12) selHours += 12;
  if (modifier === 'AM' && selHours === 12) selHours = 0;

  const selectedDate = new Date(selYear, selMonth - 1, selDay, selHours, selMinutes, 0);
  return selectedDate <= new Date();
};
const SearchableSelect = ({ options, value, onChange, placeholder }: { options: string[], value: string, onChange: (val: string) => void, placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(value);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="input-element"
        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', outline: 'none', cursor: 'text', fontFamily: 'inherit', fontSize: '0.95rem' }}
      />
      <div 
        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--grey-500)', display: 'flex', alignItems: 'center' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--white)', color: 'var(--dark)', border: '1px solid var(--grey-200)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
          {filteredOptions.length > 0 ? filteredOptions.map(opt => (
            <div
              key={opt}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', transition: 'background 0.2s', borderBottom: '1px solid var(--grey-200)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--grey-50)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => {
                onChange(opt);
                setSearchTerm(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </div>
          )) : (
            <div style={{ padding: '0.75rem 1rem', color: 'var(--grey-500)', fontStyle: 'italic' }}>No matches found</div>
          )}
        </div>
      )}
    </div>
  );
};

interface CoachDashboardProps { userName: string; onLogout: () => void; }

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ userName, onLogout }) => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  // My Clients state
  const [clients, setClients] = useState<{ id: string; name: string; coachName?: string; plan: string; city: string; email?: string; phone?: string; age?: string; gender?: string; weight?: string; height?: string; createdAt?: string; subscriptionStartDate?: string; subscriptionExpiryDate?: string }[]>([]);

  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // Popup states for Add Client
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [newClientAge, setNewClientAge] = useState('');
  const [newClientGender, setNewClientGender] = useState('');
  const [newClientWeight, setNewClientWeight] = useState('');
  const [newClientHeight, setNewClientHeight] = useState('');
  const [newClientPlan, setNewClientPlan] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');

  // Filters for Clients
  const [clientPlanFilter, setClientPlanFilter] = useState('All');
  const [clientCityFilter, setClientCityFilter] = useState('All');

  // My Coaches state
  const [coaches, setCoaches] = useState<{ id: string; name: string; clientsCount: number; level: string; status?: 'active' | 'inactive' }[]>([]);

  // Popup states for Add Coach
  const [isAddCoachOpen, setIsAddCoachOpen] = useState(false);
  const [newCoachName, setNewCoachName] = useState('');
  const [newCoachPhone, setNewCoachPhone] = useState('');
  const [newCoachEmail, setNewCoachEmail] = useState('');
  const [newCoachCity, setNewCoachCity] = useState('');
  const [newCoachGender, setNewCoachGender] = useState('Male');
  const [newCoachExperience, setNewCoachExperience] = useState('');
  const [newCoachLevel, setNewCoachLevel] = useState('');
  const [newCoachPassword, setNewCoachPassword] = useState('');

  // Filters for Coaches
  const [coachLevelFilter, setCoachLevelFilter] = useState('All');
  const [coachStatusFilter, setCoachStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Sessions state
  const [sessions, setSessions] = useState<{ id: string; type: 'client' | 'coach'; participantName: string; date: string; time: string; status: string; reminded?: boolean }[]>([]);
  const [notifications, setNotifications] = useState<{id: number; text: string; read: boolean}[]>([]);

  // Input states for scheduling
  const [scheduleType, setScheduleType] = useState<'client' | 'coach' | 'parent_coach'>('client');
  const [scheduleClient, setScheduleClient] = useState('');
  const [scheduleCoach, setScheduleCoach] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Prospects state
  const [prospects, setProspects] = useState<{ id: string; name: string; email: string; phone: string; city: string; age: string; gender: string; weight: string }[]>([]);

  const [selectedProspect, setSelectedProspect] = useState<any | null>(null);

  // Popup states for Add Prospect
  const [isAddProspectOpen, setIsAddProspectOpen] = useState(false);
  const [newProspectName, setNewProspectName] = useState('');
  const [newProspectEmail, setNewProspectEmail] = useState('');
  const [newProspectPhone, setNewProspectPhone] = useState('');
  const [newProspectCity, setNewProspectCity] = useState('');
  const [newProspectAge, setNewProspectAge] = useState('');
  const [newProspectGender, setNewProspectGender] = useState('Male');
  const [newProspectWeight, setNewProspectWeight] = useState('');

  // Filters for Prospects
  const [prospectGenderFilter, setProspectGenderFilter] = useState('All');
  const [prospectCityFilter, setProspectCityFilter] = useState('All');
  const [prospectWeightFilter, setProspectWeightFilter] = useState('All');

  // Referrals
  const [referrals, setReferrals] = useState<{ id: string; name: string; city: string; email: string; phone: string; age: string; gender: string }[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);

  // Results
  const [results, setResults] = useState<{ id: string; clientName: string; description: string; image: string }[]>([]);
  const [isAddResultOpen, setIsAddResultOpen] = useState(false);
  const [newResultClientName, setNewResultClientName] = useState('');
  const [newResultDescription, setNewResultDescription] = useState('');
  const [newResultImage, setNewResultImage] = useState('');
  const [newResultFile, setNewResultFile] = useState<File | null>(null);
  const [newResultError, setNewResultError] = useState('');
  const [selectedResult, setSelectedResult] = useState<any | null>(null);

  // Results Edit/Delete states
  const [isEditResultOpen, setIsEditResultOpen] = useState(false);
  const [editResultClientName, setEditResultClientName] = useState('');
  const [editResultDescription, setEditResultDescription] = useState('');
  const [editResultImage, setEditResultImage] = useState<string | null>(null);
  const [editResultFile, setEditResultFile] = useState<File | null>(null);
  const [isDeleteResultConfirmOpen, setIsDeleteResultConfirmOpen] = useState(false);

  // Diet Schedule
  const [dietPlans, setDietPlans] = useState<{ beginner: string; intermediate: string; advanced: string; weightLoss: string }>({ beginner: '', intermediate: '', advanced: '', weightLoss: '' });
  const [activeDietCategory, setActiveDietCategory] = useState<'beginner' | 'intermediate' | 'advanced' | 'weightLoss'>('beginner');
  const [isEditingDiet, setIsEditingDiet] = useState(false);

  // Client Plans Filters
  const [clientPlanExpirationFilter, setClientPlanExpirationFilter] = useState('All');
  const [clientPlanSort, setClientPlanSort] = useState('Plan Name');
  const [selectedClientPlan, setSelectedClientPlan] = useState<any | null>(null);

  // Complete Profile
  const [cpName, setCpName] = useState(userName || '');
  const [cpPhone, setCpPhone] = useState('');
  const [cpEmail, setCpEmail] = useState('');
  const [cpAge, setCpAge] = useState('');
  const [cpGender, setCpGender] = useState('');
  const [cpCity, setCpCity] = useState('');
  const [cpCoachName, setCpCoachName] = useState('');
  const [cpExperience, setCpExperience] = useState('');

  // Settings
  const [coachProfile, setCoachProfile] = useState<{ name: string; email: string; phone: string }>({ name: userName, email: '', phone: '' });
  const [coachNotifications, setCoachNotifications] = useState({ email: true, sms: false, push: true });

  // Manage Connections
  const [connectionsTab, setConnectionsTab] = useState<'clients' | 'coaches' | 'prospects' | 'referrals'>('clients');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string } | null>(null);
  
  // Subscription
  const [isUpdateSubscriptionModalOpen, setIsUpdateSubscriptionModalOpen] = useState(false);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState('');

  // =========================================================================
  // UTILITY & VALIDATION EFFECTS
  // =========================================================================

  const isTimeSlotInPastForToday = (timeSlot: string) => {
    if (!scheduleDate) return false;
    return isDateTimeInPast(scheduleDate, timeSlot);
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setSessions(prevSessions => {
        let changed = false;
        const newSessions = prevSessions.map(session => {
          if (session.status === 'Scheduled' && !session.reminded) {
            const dateParts = session.date.split('-');
            const timeParts = session.time.split(' ');
            if (dateParts.length === 3 && timeParts.length === 2) {
              const [y, m, d] = dateParts.map(Number);
              const [timeVal, modifier] = timeParts;
              const hmParts = timeVal.split(':');
              if (hmParts.length === 2) {
                let [h, min] = hmParts.map(Number);
                if (modifier === 'PM' && h !== 12) h += 12;
                if (modifier === 'AM' && h === 12) h = 0;
                
                const sessionDate = new Date(y, m - 1, d, h, min);
                const diffMs = sessionDate.getTime() - now.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                
                if (diffHours > 0 && diffHours <= 1) {
                  setNotifications(prev => [{
                    id: Date.now(),
                    text: `Reminder: Session with ${session.participantName} starts in 1 hour.`,
                    read: false
                  }, ...prev]);
                  changed = true;
                  return { ...session, reminded: true };
                }
              }
            }
          }
          return session;
        });
        return changed ? newSessions : prevSessions;
      });
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAddClientOpen) {
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('');
      setNewClientCity('');
      setNewClientAge('');
      setNewClientGender('');
      setNewClientWeight('');
      setNewClientHeight('');
      setNewClientPlan('');
      setNewClientPassword('');
    }
  }, [isAddClientOpen]);

  useEffect(() => {
    if (!isAddCoachOpen) {
      setNewCoachName('');
      setNewCoachPhone('');
      setNewCoachEmail('');
      setNewCoachCity('');
      setNewCoachGender('Male');
      setNewCoachExperience('');
      setNewCoachLevel('');
      setNewCoachPassword('');
    }
  }, [isAddCoachOpen]);

  useEffect(() => {
    if (!isAddProspectOpen) {
      setNewProspectName('');
      setNewProspectEmail('');
      setNewProspectPhone('');
      setNewProspectCity('');
      setNewProspectAge('');
      setNewProspectGender('Male');
      setNewProspectWeight('');
    }
  }, [isAddProspectOpen]);

  useEffect(() => {
    setScheduleError('');
    if (scheduleDate && scheduleTime) {
      if (isTimeSlotInPastForToday(scheduleTime)) {
        setScheduleTime('');
      }
    }
  }, [scheduleDate, scheduleTime]);

  const fetchCoachData = async () => {
    try {
      const res = await api.getCoachDashboard({
        clientPlan: clientPlanFilter,
        clientCity: clientCityFilter,
        coachLevel: coachLevelFilter,
        coachStatus: coachStatusFilter,
        prospectGender: prospectGenderFilter,
        prospectCity: prospectCityFilter,
        prospectWeight: prospectWeightFilter
      });
      if (res.success && res.data) {
        const d = res.data;
        if (d.clients) {
          setClients(d.clients.map((c: any) => ({
            id: c._id || c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            city: c.city,
            age: c.age,
            gender: c.gender,
            weight: c.weight,
            height: c.height,
            plan: c.clientPlan || c.plan,
            coachName: c.coachName,
            createdAt: c.createdAt,
            subscriptionStartDate: c.subscriptionStartDate ? c.subscriptionStartDate.split('T')[0] : '',
            subscriptionExpiryDate: c.subscriptionExpiryDate ? c.subscriptionExpiryDate.split('T')[0] : ''
          })));
        }
        if (d.sessions) setSessions(d.sessions);
        if (d.prospects) setProspects(d.prospects.map((p: any) => ({
          id: p._id || p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          city: p.city,
          age: p.age,
          gender: p.gender,
          weight: p.weightRange || p.weight
        })));
        if (d.referrals) setReferrals(d.referrals);
        if (d.coaches) setCoaches(d.coaches);
        if (d.results) setResults(d.results);
        if (d.notifications) setNotifications(d.notifications);
        if (d.dietPlan) {
          setDietPlans({
            beginner: d.dietPlan.beginner || '',
            intermediate: d.dietPlan.intermediate || '',
            advanced: d.dietPlan.advanced || '',
            weightLoss: d.dietPlan.weightLoss || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching coach dashboard data:', error);
    }
  };

  const handleApproveSession = async (sessionId: string) => {
    try {
      const res = await api.approveSession(sessionId);
      if (res.success) {
        await fetchCoachData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve session');
    }
  };

  const handleRejectSession = async (sessionId: string) => {
    try {
      const res = await api.rejectSession(sessionId);
      if (res.success) {
        await fetchCoachData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject session');
    }
  };

  useEffect(() => {
    fetchCoachData();
    const interval = setInterval(fetchCoachData, 10000);
    return () => clearInterval(interval);
  }, [
    clientPlanFilter,
    clientCityFilter,
    coachLevelFilter,
    coachStatusFilter,
    prospectGenderFilter,
    prospectCityFilter,
    prospectWeightFilter
  ]);

  const handleNavigate = (section: string) => {
    if (section === 'logout') onLogout();
    else {
      setCurrentSection(section);
      // Reset selected states when changing menu section
      setSelectedClient(null);
      setSelectedProspect(null);
    }
  };

  // =========================================================================
  // DYNAMIC DERIVATIONS
  // =========================================================================

  const clientsThisMonth = clients.filter(c => {
    if (!c.createdAt) return false;
    const date = new Date(c.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const getDaysRemaining = (expiryStr?: string) => {
    if (!expiryStr) return 0;
    const expiry = new Date(expiryStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const availablePlans = ['All', ...Array.from(new Set(clients.map(c => c.plan).filter(Boolean)))];
  const availableCities = ['All', ...Array.from(new Set(clients.map(c => c.city).filter(Boolean)))];

  const availableLevels = ['All', ...Array.from(new Set(coaches.map(c => c.level).filter(Boolean)))];

  const availableProspectCities = ['All', ...Array.from(new Set(prospects.map(p => p.city).filter(Boolean)))];

  // =========================================================================
  // FILTERING LOGIC
  // =========================================================================

  const filteredClients = clients.filter(c => {
    if (clientPlanFilter !== 'All' && c.plan !== clientPlanFilter) return false;
    if (clientCityFilter !== 'All' && c.city !== clientCityFilter) return false;
    return true;
  });

  const filteredCoaches = coaches.filter(c => {
    if (coachLevelFilter !== 'All' && c.level !== coachLevelFilter) return false;
    return true;
  });

  const filteredProspects = prospects.filter(p => {
    if (prospectGenderFilter !== 'All' && p.gender !== prospectGenderFilter) return false;
    if (prospectCityFilter !== 'All' && p.city !== prospectCityFilter) return false;
    if (prospectWeightFilter !== 'All') {
      const w = Number(p.weight);
      if (isNaN(w)) return false;
      if (prospectWeightFilter === 'Below 50' && w >= 50) return false;
      if (prospectWeightFilter === '50–60' && (w < 50 || w >= 60)) return false;
      if (prospectWeightFilter === '60–70' && (w < 60 || w >= 70)) return false;
      if (prospectWeightFilter === '70–80' && (w < 70 || w >= 80)) return false;
      if (prospectWeightFilter === '80–90' && (w < 80 || w >= 90)) return false;
      if (prospectWeightFilter === '90–100' && (w < 90 || w >= 100)) return false;
      if (prospectWeightFilter === '100+' && w < 100) return false;
    }
    return true;
  });

  // =========================================================================
  // VIEW RENDERING
  // =========================================================================

  const getGreeting = () => {
    const name = cpName ? cpName.split(' ')[0] : "Coach";
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Good morning, ${name}! ☀️`;
    if (hour >= 12 && hour < 17) return `Good afternoon, ${name}! 👋`;
    if (hour >= 17 && hour < 21) return `Good evening, ${name}! 🌇`;
    return `Good night, ${name}! 🌙`;
  };

  const renderContent = () => {
    // -----------------------------------------------------------------------
    // DASHBOARD SECTION
    // -----------------------------------------------------------------------
    if (currentSection === 'dashboard') {
      return (
        <div className="section-content page-enter">
          <div className="dashboard-top-section">
            <div className="welcome-banner">
              <div>
                <h2>{getGreeting()}</h2>
                <p className="section-subtitle">Here is your overall summary</p>
              </div>
            </div>
            
            <div className="dashboard-stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Clients</div>
              <div className="stat-value">{clients.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Scheduled Sessions</div>
              <div className="stat-value">{sessions.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Prospects</div>
              <div className="stat-value">{prospects.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Clients This Month</div>
              <div className="stat-value">{clientsThisMonth}</div>
            </div>
          </div>
        </div>

<div className="schedule-session-layout">
            <div className="main-card" style={{ padding: '2rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '1.5rem' }}>Book Session</h4>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: 'var(--grey-700)', fontSize: '0.9rem' }}>Schedule With</label>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="scheduleType" value="client" checked={scheduleType === 'client'} onChange={() => { setScheduleType('client'); setScheduleCoach(''); }} />
                    Client
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="scheduleType" value="coach" checked={scheduleType === 'coach'} onChange={() => { setScheduleType('coach'); setScheduleClient(''); }} />
                    Coach
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="scheduleType" value="parent_coach" checked={scheduleType === 'parent_coach'} onChange={() => { setScheduleType('parent_coach'); setScheduleClient(''); setScheduleCoach(''); }} />
                    My Coach
                  </label>
                </div>
              </div>
              {scheduleType === 'client' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: 'var(--grey-700)', fontSize: '0.9rem' }}>Client Name</label>
                  <SearchableSelect options={clients.map(c => c.name)} value={scheduleClient} onChange={setScheduleClient} placeholder="Select Client" />
                </div>
              )}
              {scheduleType === 'coach' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: 'var(--grey-700)', fontSize: '0.9rem' }}>Coach Name</label>
                  <SearchableSelect options={coaches.map(c => c.name)} value={scheduleCoach} onChange={setScheduleCoach} placeholder="Select Coach" />
                </div>
              )}
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div 
                  onClick={() => {
                    if (dateInputRef.current) {
                      try {
                        dateInputRef.current.showPicker();
                      } catch (e) {
                        dateInputRef.current.click();
                      }
                    }
                  }}
                  style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-xs)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ position: 'absolute', pointerEvents: 'none', fontSize: '1.6rem', zIndex: 1 }}>📅</span>
                  <input 
                    ref={dateInputRef}
                    type="date" 
                    value={scheduleDate} 
                    onChange={e => setScheduleDate(e.target.value)} 
                    min={getLocalTodayString()}
                    style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} 
                  />
                </div>
                {scheduleDate && <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '1.1rem' }}>{scheduleDate}</div>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: 'var(--grey-700)', fontSize: '0.9rem' }}>Time Slot</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {['10:00 AM', '11:00 AM', '12:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'].map(time => {
                    const isPast = isTimeSlotInPastForToday(time);
                    return (
                      <button 
                        key={time} 
                        onClick={() => !isPast && setScheduleTime(time)} 
                        disabled={isPast}
                        style={{ 
                          padding: '0.75rem 0.5rem', 
                          border: `1px solid ${scheduleTime === time ? 'var(--dark)' : 'var(--grey-200)'}`, 
                          borderRadius: '6px', 
                          background: scheduleTime === time ? 'var(--dark)' : 'var(--white)', 
                          cursor: isPast ? 'not-allowed' : 'pointer', 
                          fontSize: '0.9rem', 
                          color: scheduleTime === time ? 'var(--white)' : 'var(--grey-700)', 
                          transition: 'all 0.2s', 
                          fontWeight: scheduleTime === time ? 'bold' : 'normal',
                          opacity: isPast ? 0.35 : 1
                        }}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginTop: '2rem' }}>
                {scheduleError && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 500, textAlign: 'center' }}>
                    {scheduleError}
                  </div>
                )}
                <Button variant="primary" fullWidth onClick={async () => {
                  if (scheduleType === 'client' && !scheduleClient) {
                    setScheduleError("Please select a client.");
                    return;
                  }
                  if (scheduleType === 'coach' && !scheduleCoach) {
                    setScheduleError("Please select a coach.");
                    return;
                  }
                  if (!scheduleDate || !scheduleTime) {
                    setScheduleError("Please select a future date and time.");
                    return;
                  }
                  if (isDateTimeInPast(scheduleDate, scheduleTime)) {
                    setScheduleError("Please select a future date and time.");
                    return;
                  }

                  try {
                    const clientObj = clients.find(c => c.name === scheduleClient);
                    const res = await api.scheduleSession({
                      date: scheduleDate,
                      time: scheduleTime,
                      clientId: scheduleType === 'client' ? (clientObj ? clientObj.id : undefined) : undefined,
                      withParentCoach: scheduleType === 'parent_coach'
                    });
                    if (res.success) {
                      await fetchCoachData();
                      setScheduleClient('');
                      setScheduleCoach('');
                      setScheduleDate('');
                      setScheduleTime('');
                      setScheduleError('');
                    }
                  } catch (err: any) {
                    setScheduleError(err.message || 'Failed to schedule session');
                  }
                }}>SCHEDULE SESSION</Button>
              </div>
            </div>

            <div className="main-card" style={{ padding: '2rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '1.5rem' }}>Scheduled Sessions</h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {sessions.length > 0 ? (
                  sessions.map(session => (
                    <div key={session.id} style={{ padding: '1rem', border: '1px solid var(--grey-200)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '2rem' }}>📅</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: 600, color: 'var(--dark)' }}>
                          {session.title || (session.type === 'client' ? 'Client Session' : 'Coach Session')}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--grey-500)' }}>{session.participantName} • {session.time}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState icon="📅" title="No sessions scheduled" subtitle="Fill out the scheduling form to book a session." />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    if (currentSection === 'my-clients') {
      if (selectedClient) {
        return (
          <div className="section-content page-enter" style={{ position: 'relative', paddingBottom: '4rem' }}>
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <button className="back-to-dashboard-btn" onClick={() => setSelectedClient(null)} title="Back to Client List" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>{selectedClient.name}</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Detailed client tracking and analysis</p>
              </div>
            </div>
            </div>
            
            <div className="form-row" style={{ marginTop: '1.5rem' }}>
              <div className="main-card" style={{ padding: '2rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)' }}>Personal Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem', fontSize: '0.95rem' }}>
                  <div><strong>Name:</strong> {selectedClient.name}</div>
                  <div><strong>Coach Name:</strong> {selectedClient.coachName}</div>
                  <div><strong>Client Plan:</strong> {selectedClient.plan}</div>
                  <div><strong>City:</strong> {selectedClient.city}</div>
                </div>
              </div>

              <div className="main-card" style={{ padding: '2rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)' }}>Active Goal</h4>
                <div style={{ marginTop: '1.25rem', color: 'var(--grey-500)', fontSize: '0.95rem' }}>
                  Active goal parameters placeholder.
                </div>
              </div>



              <div className="main-card" style={{ padding: '2rem', gridColumn: 'span 2' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)' }}>Medical Records</h4>
                <div style={{ marginTop: '1.25rem', color: 'var(--grey-500)', fontSize: '0.95rem' }}>
                  Medical records PDF documents placeholder.
                </div>
              </div>
            </div>

            <div className="main-card" style={{ marginTop: '1.5rem', padding: '2rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '1.25rem' }}>Body Parameter Graph</h4>
              <div style={{ height: '300px', background: 'var(--off-white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--grey-400)', border: '1px dashed var(--grey-300)', borderRadius: '8px' }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Analytics Graph Structure Placeholder</span>
              </div>
            </div>

            <div className="main-card" style={{ marginTop: '1.5rem', padding: '2rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '1.25rem' }}>Body Measurement Graph</h4>
              <div style={{ height: '300px', background: 'var(--off-white)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--grey-400)', border: '1px dashed var(--grey-300)', borderRadius: '8px' }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Measurements Graph Structure Placeholder</span>
              </div>
            </div>
            <div className="main-card" style={{ marginTop: '1.5rem', padding: '2rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '1.25rem' }}>Client Subscription</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                <div><strong>Start Date:</strong> {selectedClient.subscriptionStartDate || 'Not Set'}</div>
                <div><strong>Expiry Date:</strong> {selectedClient.subscriptionExpiryDate || 'Not Set'}</div>
                <div><strong>Days Remaining:</strong> {getDaysRemaining(selectedClient.subscriptionExpiryDate)}</div>
              </div>
              <Button variant="primary" onClick={() => setIsUpdateSubscriptionModalOpen(true)}>Update Subscription</Button>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
              <Button variant="danger" onClick={() => { setItemToDelete({ type: 'client', id: selectedClient.id }); setIsDeleteModalOpen(true); }}>Delete Profile</Button>
            </div>
          </div>
        );
      }

      return (
        <div className="section-content page-enter" style={{ position: 'relative', minHeight: 'calc(100vh - 120px)', paddingBottom: '6rem' }}>
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>My Clients</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Manage and track all your clients</p>
              </div>
            </div>
          </div>

          <div className="controls-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-600)' }}>Client Plan</label>
              <select className="control-select" value={clientPlanFilter} onChange={e => setClientPlanFilter(e.target.value)}>
                {availablePlans.map(plan => <option key={plan} value={plan}>{plan}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-600)' }}>City</label>
              <select className="control-select" value={clientCityFilter} onChange={e => setClientCityFilter(e.target.value)}>
                {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
          </div>

          {filteredClients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {filteredClients.map(c => (
                <div key={c.id} onClick={() => setSelectedClient(c)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem', border: '1px solid var(--grey-200)', borderRadius: '12px', background: 'var(--white)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--dark)' }}>{c.name}</h3>
                  <div style={{ display: 'flex', gap: '2rem', color: 'var(--grey-600)', fontSize: '0.95rem', flexWrap: 'wrap' }}>
                    {c.email && <div><a href={`mailto:${c.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{c.email}</a></div>}
                    {c.phone && <div>{c.phone}</div>}
                    {c.weight && <div>Weight: {c.weight} kg</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="👥" title="No clients found" subtitle="Share your profile link to invite clients or add one manually." />
          )}

          <button className="floating-action-btn" onClick={() => setIsAddClientOpen(true)}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add Client
          </button>

          <Modal isOpen={isAddClientOpen} onClose={() => setIsAddClientOpen(false)} title="Add Client">
            <div className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <label>Name *</label>
                <input type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="e.g. John Doe" />
              </div>
              <div className="form-field">
                <label>Email Address *</label>
                <input type="email" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} placeholder="e.g. john@email.com" />
              </div>
              <div className="form-field">
                <label>Phone Number *</label>
                <input type="text" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} placeholder="e.g. +91 9876543210" />
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>City</label>
                  <input type="text" value={newClientCity} onChange={e => setNewClientCity(e.target.value)} placeholder="e.g. Mumbai" />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Age</label>
                  <input type="number" value={newClientAge} onChange={e => setNewClientAge(e.target.value)} placeholder="e.g. 30" />
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Gender</label>
                  <select className="control-select" value={newClientGender} onChange={e => setNewClientGender(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', backgroundColor: 'var(--white)' }}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Current Weight (kg)</label>
                  <input type="number" value={newClientWeight} onChange={e => setNewClientWeight(e.target.value)} placeholder="e.g. 78" />
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Height (cm)</label>
                  <input type="number" value={newClientHeight} onChange={e => setNewClientHeight(e.target.value)} placeholder="e.g. 175" />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Client Plan *</label>
                  <select value={newClientPlan} onChange={e => setNewClientPlan(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: 'var(--white)' }}>
                    <option value="">Select Plan</option>
                    <option value="UMS Plan">UMS Plan</option>
                    <option value="Subscription Plan">Subscription Plan</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Password *</label>
                <input type="password" value={newClientPassword} onChange={e => setNewClientPassword(e.target.value)} placeholder="Mandatory password" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Button variant="ghost" fullWidth onClick={() => setIsAddClientOpen(false)}>Cancel</Button>
                 <Button variant="primary" fullWidth onClick={async () => {
                   if (!newClientName || !newClientPhone || !newClientEmail || !newClientPlan || !newClientPassword) {
                     alert("Please fill name, email, phone number, plan, and password");
                     return;
                   }
                   try {
                     const res = await api.addClient({
                       name: newClientName,
                       email: newClientEmail,
                       phone: newClientPhone,
                       city: newClientCity,
                       age: newClientAge,
                       gender: newClientGender,
                       weight: newClientWeight,
                       height: newClientHeight,
                       clientPlan: newClientPlan,
                       password: newClientPassword
                     });
                     if (res.success) {
                       await fetchCoachData();
                       setIsAddClientOpen(false);
                     }
                   } catch (err: any) {
                     alert(err.message || 'Failed to add client');
                   }
                 }}>Add Client</Button>
              </div>
            </div>
          </Modal>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // MY COACHES SECTION
    // -----------------------------------------------------------------------
    if (currentSection === 'my-coaches') {
      return (
        <div className="section-content page-enter" style={{ position: 'relative', minHeight: 'calc(100vh - 120px)', paddingBottom: '6rem' }}>
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>My Coaches</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Manage and track level definitions</p>
              </div>
            </div>
          </div>

          <div className="controls-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-600)' }}>Level</label>
              <select className="control-select" value={coachLevelFilter} onChange={e => setCoachLevelFilter(e.target.value)}>
                {availableLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-600)' }}>Status</label>
              <select className="control-select" value={coachStatusFilter} onChange={e => setCoachStatusFilter(e.target.value as any)}>
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {filteredCoaches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {filteredCoaches.map(c => (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem', border: '1px solid var(--grey-200)', borderRadius: '12px', background: 'var(--white)', cursor: 'default', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--dark)' }}>{c.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '2rem', color: 'var(--grey-600)', fontSize: '0.95rem', alignItems: 'center' }}>
                      <div>Clients: {c.clientsCount}</div>
                      <div>Level: {c.level}</div>
                      <div style={{ fontWeight: 600, color: (c.status || 'active') === 'active' ? 'var(--green)' : '#d97706' }}>
                        {(c.status || 'active') === 'active' ? '🟢 Active' : '🟡 Inactive'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        style={{ 
                          backgroundColor: (c.status || 'active') === 'active' ? 'var(--green)' : '#f59e0b',
                          color: (c.status || 'active') === 'active' ? 'var(--white)' : 'var(--dark)',
                          borderColor: (c.status || 'active') === 'active' ? 'var(--green)' : '#f59e0b'
                        }}
                        onClick={() => {
                          setCoaches(coaches.map(coach => coach.id === c.id ? { ...coach, status: (coach.status || 'active') === 'active' ? 'inactive' : 'active' } : coach));
                        }}
                      >
                        {(c.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => { setItemToDelete({ type: 'coach', id: c.id }); setIsDeleteModalOpen(true); }}>Delete Profile</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="👥" title="No coaches found" subtitle="Add coaches to get started." />
          )}

          <button className="floating-action-btn" onClick={() => setIsAddCoachOpen(true)}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add Coach
          </button>

          <Modal isOpen={isAddCoachOpen} onClose={() => setIsAddCoachOpen(false)} title="Add Coach">
            <div className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <label>Coach Name *</label>
                <input type="text" value={newCoachName} onChange={e => setNewCoachName(e.target.value)} placeholder="e.g. Sarah Johnson" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Phone Number *</label>
                  <input type="text" value={newCoachPhone} onChange={e => setNewCoachPhone(e.target.value)} placeholder="e.g. +91 9876543210" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Email Address *</label>
                  <input type="email" value={newCoachEmail} onChange={e => setNewCoachEmail(e.target.value)} placeholder="e.g. sarah@email.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>City</label>
                  <input type="text" value={newCoachCity} onChange={e => setNewCoachCity(e.target.value)} placeholder="e.g. Delhi" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Gender</label>
                  <select className="control-select" value={newCoachGender} onChange={e => setNewCoachGender(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', backgroundColor: 'var(--white)' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Experience (Years)</label>
                  <input type="text" value={newCoachExperience} onChange={e => setNewCoachExperience(e.target.value)} placeholder="e.g. 5" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Level *</label>
                  <select value={newCoachLevel} onChange={e => setNewCoachLevel(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: 'var(--white)' }}>
                    <option value="">Select Level</option>
                    <option value="Associate">Associate</option>
                    <option value="Senior Consultant">Senior Consultant</option>
                    <option value="Success Builder">Success Builder</option>
                    <option value="Qualified producer">Qualified producer</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="TAB Team">TAB Team</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Password *</label>
                <input type="password" value={newCoachPassword} onChange={e => setNewCoachPassword(e.target.value)} placeholder="Password for login" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Button variant="ghost" fullWidth onClick={() => setIsAddCoachOpen(false)}>Cancel</Button>
                 <Button variant="primary" fullWidth onClick={async () => {
                   if (!newCoachName || !newCoachPhone || !newCoachEmail || !newCoachLevel || !newCoachPassword) {
                     alert('Please enter name, phone number, email, level, and password');
                     return;
                   }
                   try {
                     const res = await api.addCoach({
                       name: newCoachName,
                       phone: newCoachPhone,
                       email: newCoachEmail,
                       city: newCoachCity,
                       gender: newCoachGender,
                       experience: newCoachExperience,
                       level: newCoachLevel,
                       password: newCoachPassword
                     });
                     if (res.success) {
                       await fetchCoachData();
                       setIsAddCoachOpen(false);
                     }
                   } catch (err: any) {
                     alert(err.message || 'Failed to add coach');
                   }
                 }}>Add Coach</Button>
              </div>
            </div>
          </Modal>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // PROSPECTS SECTION
    // -----------------------------------------------------------------------
    if (currentSection === 'prospects') {
      if (selectedProspect) {
        return (
          <div className="section-content page-enter">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>Prospect Details</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Detailed prospect contact information</p>
              </div>
            </div>
              <Button variant="secondary" onClick={() => setSelectedProspect(null)}>← Back to List</Button>
            </div>
            <div className="main-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--dark)', marginBottom: '1.5rem' }}>{selectedProspect.name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1rem' }}>
                <div><strong>Email Address:</strong> {selectedProspect.email}</div>
                <div><strong>Phone Number:</strong> {selectedProspect.phone}</div>
                <div><strong>City:</strong> {selectedProspect.city}</div>
                <div><strong>Age:</strong> {selectedProspect.age}</div>
                <div><strong>Gender:</strong> {selectedProspect.gender}</div>
                <div><strong>Weight:</strong> {selectedProspect.weight} kg</div>
              </div>
              <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
                <Button variant="danger" onClick={() => { setItemToDelete({ type: 'prospect', id: selectedProspect.id }); setIsDeleteModalOpen(true); }}>Delete Profile</Button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="section-content page-enter" style={{ position: 'relative', minHeight: 'calc(100vh - 120px)', paddingBottom: '6rem' }}>
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>Prospects</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Manage and track incoming leads</p>
              </div>
            </div>
          </div>

          <div className="controls-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-600)' }}>Gender</label>
              <select className="control-select" value={prospectGenderFilter} onChange={e => setProspectGenderFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-600)' }}>City</label>
              <select className="control-select" value={prospectCityFilter} onChange={e => setProspectCityFilter(e.target.value)}>
                {availableProspectCities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-600)' }}>Weight Range</label>
              <select className="control-select" value={prospectWeightFilter} onChange={e => setProspectWeightFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Below 50">Below 50</option>
                <option value="50–60">50–60</option>
                <option value="60–70">60–70</option>
                <option value="70–80">70–80</option>
                <option value="80–90">80–90</option>
                <option value="90–100">90–100</option>
                <option value="100+">100+</option>
              </select>
            </div>
          </div>

          {filteredProspects.length > 0 ? (
            <div className="coach-list-grid">
              {filteredProspects.map(p => (
                <div key={p.id} className="coach-list-card" onClick={() => setSelectedProspect(p)}>
                  <h4 className="coach-list-card-title">{p.name}</h4>
                  <div className="coach-list-card-subtitle">City: {p.city}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="👥" title="No prospects found" subtitle="Add a new prospect to begin." />
          )}

          <button className="floating-action-btn" onClick={() => setIsAddProspectOpen(true)}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add Prospect
          </button>

          <Modal isOpen={isAddProspectOpen} onClose={() => setIsAddProspectOpen(false)} title="Add Prospect">
            <div className="settings-form">
              <div className="form-field">
                <label>Name *</label>
                <input type="text" value={newProspectName} onChange={e => setNewProspectName(e.target.value)} placeholder="e.g. Jack Vance" />
              </div>
              <div className="form-field">
                <label>Email *</label>
                <input type="email" value={newProspectEmail} onChange={e => setNewProspectEmail(e.target.value)} placeholder="e.g. jack@gmail.com" />
              </div>
              <div className="form-field">
                <label>Phone Number *</label>
                <input type="tel" value={newProspectPhone} onChange={e => setNewProspectPhone(e.target.value)} placeholder="e.g. 555-0199" />
              </div>
              <div className="form-field">
                <label>City *</label>
                <input type="text" value={newProspectCity} onChange={e => setNewProspectCity(e.target.value)} placeholder="e.g. Seattle" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Age *</label>
                  <input type="number" value={newProspectAge} onChange={e => setNewProspectAge(e.target.value)} placeholder="28" />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Weight (kg) *</label>
                  <input type="number" value={newProspectWeight} onChange={e => setNewProspectWeight(e.target.value)} placeholder="80" />
                </div>
              </div>
              <div className="gender-selector" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--grey-700)' }}>Gender</label>
                <div className="gender-options" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button className={`gender-option ${newProspectGender === 'Male' ? 'selected' : ''}`} onClick={() => setNewProspectGender('Male')} style={{ flex: 1, padding: '0.5rem', border: '1.5px solid var(--grey-200)', borderRadius: 'var(--radius-full)', background: newProspectGender === 'Male' ? 'var(--dark)' : 'var(--white)', color: newProspectGender === 'Male' ? 'var(--white)' : 'inherit', cursor: 'pointer', textAlign: 'center' }}>Male</button>
                  <button className={`gender-option ${newProspectGender === 'Female' ? 'selected' : ''}`} onClick={() => setNewProspectGender('Female')} style={{ flex: 1, padding: '0.5rem', border: '1.5px solid var(--grey-200)', borderRadius: 'var(--radius-full)', background: newProspectGender === 'Female' ? 'var(--dark)' : 'var(--white)', color: newProspectGender === 'Female' ? 'var(--white)' : 'inherit', cursor: 'pointer', textAlign: 'center' }}>Female</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Button variant="ghost" fullWidth onClick={() => setIsAddProspectOpen(false)}>Cancel</Button>
                 <Button variant="primary" fullWidth onClick={async () => {
                   if (!newProspectName || !newProspectEmail || !newProspectPhone || !newProspectCity || !newProspectAge || !newProspectWeight) {
                     alert("Please fill all fields");
                     return;
                   }
                   try {
                     const res = await api.addProspect({
                       name: newProspectName,
                       email: newProspectEmail,
                       phone: newProspectPhone,
                       city: newProspectCity,
                       age: newProspectAge,
                       gender: newProspectGender,
                       weight: newProspectWeight
                     });
                     if (res.success) {
                       await fetchCoachData();
                       setIsAddProspectOpen(false);
                     }
                   } catch (err: any) {
                     alert(err.message || 'Failed to add prospect');
                   }
                 }}>Add Prospect</Button>
              </div>
            </div>
          </Modal>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // MESSAGES SECTION
    // -----------------------------------------------------------------------
    if (currentSection === 'messages') {
      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>Messages</h2>
            </div>
          </div>
          <div className="main-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <EmptyState icon="💬" title="No messages available." subtitle="" />
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // SETTINGS SECTION
    // -----------------------------------------------------------------------
    if (currentSection === 'settings') {
      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>Settings</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '2rem' }}>

            
            <div className="main-card settings-card">
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '1.5rem' }}>Notifications</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Toggle label="Email Notifications" description="Receive updates via email" checked={coachNotifications.email} onChange={checked => setCoachNotifications({...coachNotifications, email: checked})} />
                <Toggle label="SMS Notifications" description="Receive text messages for urgent alerts" checked={coachNotifications.sms} onChange={checked => setCoachNotifications({...coachNotifications, sms: checked})} />
                <Toggle label="Push Notifications" description="Receive app notifications" checked={coachNotifications.push} onChange={checked => setCoachNotifications({...coachNotifications, push: checked})} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // REFERRALS SECTION
    // -----------------------------------------------------------------------
    if (currentSection === 'referrals') {
      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>Referrals</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Track new leads referred by existing clients</p>
              </div>
            </div>
          </div>
          {selectedReferral ? (
            <div className="main-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => setSelectedReferral(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--grey-600)' }}>←</button>
                <h3 style={{ margin: 0 }}>Referral Details</h3>
              </div>
              <div className="form-row" style={{ gap: '2rem' }}>
                <div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>Name</label><div style={{ fontWeight: 600 }}>{selectedReferral.name}</div></div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>Email</label><div style={{ fontWeight: 600 }}>{selectedReferral.email}</div></div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>Phone</label><div style={{ fontWeight: 600 }}>{selectedReferral.phone}</div></div>
                </div>
                <div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>City</label><div style={{ fontWeight: 600 }}>{selectedReferral.city}</div></div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>Age</label><div style={{ fontWeight: 600 }}>{selectedReferral.age}</div></div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>Gender</label><div style={{ fontWeight: 600 }}>{selectedReferral.gender}</div></div>
                </div>
              </div>
              <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
                <Button variant="danger" onClick={() => { setItemToDelete({ type: 'referral', id: selectedReferral.id }); setIsDeleteModalOpen(true); }}>Delete Profile</Button>
              </div>
            </div>
          ) : (
            <div className="main-card" style={{ padding: '1rem' }}>
              {referrals.length === 0 ? (
                <EmptyState icon="🎁" title="No referrals available." subtitle="Referrals submitted by your clients will appear here." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {referrals.map(r => (
                    <div key={r.id} onClick={() => setSelectedReferral(r)} style={{ padding: '1rem', border: '1px solid var(--grey-200)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>{r.name}</div>
                      <div style={{ color: 'var(--grey-500)', fontSize: '0.9rem' }}>{r.city}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // RESULTS SECTION
    // -----------------------------------------------------------------------
    if (currentSection === 'results') {
      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>Results</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Track and showcase client transformations</p>
              </div>
            </div>
          </div>
          {selectedResult ? (
            <div className="main-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => setSelectedResult(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--grey-600)' }}>←</button>
                <h3 style={{ margin: 0 }}>Result Details</h3>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: 'var(--grey-600)', fontSize: '0.8rem', fontWeight: 600 }}>Client Name</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--dark)' }}>{selectedResult.clientName}</div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: 'var(--grey-600)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Description</div>
                <p style={{ margin: 0, color: 'var(--dark)', lineHeight: '1.6' }}>{selectedResult.description}</p>
              </div>
              {selectedResult.image && (
                <div style={{ marginBottom: '2rem' }}>
                  <img src={selectedResult.image} alt="Transformation" style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid var(--grey-200)' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <Button variant="secondary" onClick={() => {
                  setEditResultClientName(selectedResult.clientName);
                  setEditResultDescription(selectedResult.description);
                  setEditResultImage(selectedResult.image);
                  setEditResultFile(null);
                  setIsEditResultOpen(true);
                }}>Edit Result</Button>
                <Button variant="danger" onClick={() => setIsDeleteResultConfirmOpen(true)}>Delete Result</Button>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', minHeight: '400px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {results.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <EmptyState icon="📷" title="No results available." subtitle="Click the + button to add client transformation results." />
                  </div>
                ) : (
                  results.map(r => (
                    <div key={r.id} onClick={() => setSelectedResult(r)} style={{ background: 'var(--white)', borderRadius: '12px', border: '1px solid var(--grey-200)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                      <div style={{ height: '160px', background: 'var(--grey-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {r.image ? <img src={r.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '3rem', color: 'var(--grey-300)' }}>📷</span>}
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--dark)' }}>{r.clientName}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <Button 
                  variant="primary" 
                  onClick={() => setIsAddResultOpen(true)}
                >
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add Result
                </Button>
              </div>
            </div>
          )}
          
          <Modal isOpen={isAddResultOpen} onClose={() => setIsAddResultOpen(false)} title="Add Client Result" customWidth="750px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Client Name Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--dark)' }}>Client Name</label>
                <input 
                  type="text" 
                  value={newResultClientName} 
                  onChange={e => {
                    setNewResultClientName(e.target.value);
                    if (newResultError && e.target.value) setNewResultError("");
                  }} 
                  placeholder="e.g. Rahul Sharma"
                  style={{ height: '48px', width: '100%', borderRadius: '12px', padding: '0 16px', border: '1px solid var(--grey-200)', backgroundColor: 'var(--white)', outline: 'none', color: 'var(--dark)' }} 
                />
                {newResultError && <span style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500 }}>⚠ {newResultError}</span>}
              </div>

              {/* Description Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--dark)' }}>Description</label>
                <textarea 
                  value={newResultDescription} 
                  onChange={e => setNewResultDescription(e.target.value)} 
                  placeholder="Describe the transformation..."
                  style={{ height: '140px', width: '100%', borderRadius: '12px', padding: '16px', border: '1px solid var(--grey-200)', backgroundColor: 'var(--white)', resize: 'vertical', outline: 'none', color: 'var(--dark)' }} 
                />
              </div>

              {/* Result Image Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--dark)' }}>Result Image</label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <input 
                    type="file" 
                    id="coach-add-result-upload"
                    accept="image/*" 
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewResultFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewResultImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                  <label 
                    htmlFor="coach-add-result-upload"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', height: '48px', backgroundColor: 'var(--grey-100)', color: 'var(--dark)', borderRadius: '12px', cursor: 'pointer', fontWeight: 500, transition: 'background-color 0.2s', border: '1px solid var(--grey-200)' }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📷</span> Upload Result Image
                  </label>
                  {newResultFile && <span style={{ color: 'var(--grey-600)', fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>Selected: {newResultFile.name}</span>}
                </div>

                {newResultImage && (
                  <div style={{ marginTop: '16px', width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--grey-200)', backgroundColor: 'var(--grey-50)' }}>
                    <img src={newResultImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--grey-200)' }}>
                <button 
                  onClick={() => { setIsAddResultOpen(false); setNewResultError(""); }}
                  style={{ flex: 1, height: '48px', backgroundColor: 'var(--grey-100)', color: 'var(--dark)', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (!newResultClientName) {
                      setNewResultError("Client name is required.");
                      return;
                    }
                    if (!newResultFile) {
                      setNewResultError("Result image is required.");
                      return;
                    }
                    
                    try {
                      const res = await api.uploadResult({
                        clientName: newResultClientName,
                        description: newResultDescription,
                        file: newResultFile
                      });
                      if (res.success) {
                        setResults(prev => [...prev, {
                          id: res.data._id,
                          clientName: res.data.clientName,
                          description: res.data.description,
                          image: res.data.image?.secure_url || res.data.image
                        }]);
                        setNewResultClientName('');
                        setNewResultDescription('');
                        setNewResultImage('');
                        setNewResultFile(null);
                        setNewResultError('');
                        setIsAddResultOpen(false);
                      }
                    } catch (err: any) {
                      alert(err.message || 'Failed to upload result');
                    }
                  }}
                  style={{ flex: 1, height: '48px', backgroundColor: 'var(--dark)', color: 'var(--white)', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }}
                >
                  Save Result
                </button>
              </div>
            </div>
          </Modal>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // DIET SCHEDULE SECTION
    // -----------------------------------------------------------------------
    if (currentSection === 'diet-schedule') {
      const hasPlan = dietPlans[activeDietCategory] && dietPlans[activeDietCategory].trim() !== '';

      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>Diet Schedule</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Create and manage base diet plans</p>
              </div>
            </div>
          </div>
          <div className="meal-tabs">
            {[{ id: 'beginner', label: 'Beginner (1–7 Days)', icon: '🟢' }, { id: 'intermediate', label: 'Intermediate (8–20 Days)', icon: '🟡' }, { id: 'advanced', label: 'Advanced (21+ Days)', icon: '🔴' }, { id: 'weightLoss', label: 'Weight Loss Challenge', icon: '🔥' }].map(meal => (
              <button 
                key={meal.id} 
                className={`meal-tab ${activeDietCategory === meal.id ? 'active' : ''}`} 
                onClick={() => {
                  setActiveDietCategory(meal.id as any);
                  setIsEditingDiet(false);
                }}
              >
                {meal.icon} {meal.label}
              </button>
            ))}
          </div>
          <div className="diet-card">
            <div className="meal-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                {activeDietCategory === 'beginner' ? '🟢 Beginner (1–7 Days)' : activeDietCategory === 'intermediate' ? '🟡 Intermediate (8–20 Days)' : activeDietCategory === 'advanced' ? '🔴 Advanced (21+ Days)' : '🔥 Weight Loss Challenge'}
              </h3>
              {!isEditingDiet && hasPlan && (
                <Button variant="secondary" size="sm" onClick={() => setIsEditingDiet(true)}>Edit Plan</Button>
              )}
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {isEditingDiet ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <textarea 
                    className="control-input" 
                    rows={12} 
                    value={dietPlans[activeDietCategory]} 
                    onChange={e => setDietPlans({ ...dietPlans, [activeDietCategory]: e.target.value })}
                    placeholder={`Type the ${activeDietCategory} diet plan details here...`}
                    style={{ 
                      fontFamily: 'inherit', 
                      fontSize: '0.95rem', 
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid var(--primary)',
                      backgroundColor: 'var(--white)',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                      lineHeight: '1.6',
                      resize: 'vertical'
                    }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                    <Button variant="secondary" onClick={() => setIsEditingDiet(false)}>Cancel</Button>
                     <Button variant="primary" onClick={async () => {
                      try {
                        const res = await api.uploadDietPlan({
                          [activeDietCategory]: dietPlans[activeDietCategory]
                        });
                        if (res.success) {
                          setIsEditingDiet(false);
                          await fetchCoachData();
                        }
                      } catch (err: any) {
                        alert(err.message || 'Failed to save diet plan');
                      }
                    }}>Save Plan</Button>
                  </div>
                </div>
              ) : (
                hasPlan ? (
                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: 'var(--dark)', fontSize: '0.95rem' }}>
                    {dietPlans[activeDietCategory]}
                  </div>
                ) : (
                  <div className="meal-empty">
                    <EmptyState 
                      icon="🥗" 
                      title="No diet plan created yet" 
                      subtitle="Create a personalized diet schedule for your clients." 
                      ctaLabel="Create Plan"
                      onCta={() => setIsEditingDiet(true)}
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // CLIENT PLANS SECTION
    // -----------------------------------------------------------------------
    if (currentSection === 'client-plans') {
      const activeClientPlans = clients
        .filter(c => c.plan)
        .map(c => {
          const daysLeft = c.subscriptionExpiryDate ? getDaysRemaining(c.subscriptionExpiryDate) : null;
          return {
            id: c.id,
            clientName: c.name,
            planName: c.plan,
            daysLeft: daysLeft,
            startDate: c.subscriptionStartDate,
            expirationDate: c.subscriptionExpiryDate
          };
        });

      const filteredClientPlans = activeClientPlans.filter(p => {
        if (clientPlanSort !== 'All Plans' && clientPlanSort !== 'Plan Name') {
          if (p.planName?.trim().toLowerCase() !== clientPlanSort?.trim().toLowerCase()) return false;
        }
        
        if (clientPlanExpirationFilter !== 'All') {
          if (p.daysLeft === null) return false;
          if (clientPlanExpirationFilter === 'Expiring within 15 days' && p.daysLeft > 15) return false;
          if (clientPlanExpirationFilter === 'Expiring within 10 days' && p.daysLeft > 10) return false;
          if (clientPlanExpirationFilter === 'Expiring within 5 days' && p.daysLeft > 5) return false;
          if (clientPlanExpirationFilter === 'Expiring within 1 day' && p.daysLeft > 1) return false;
        }
        return true;
      });

      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>Client Plans</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Track assigned plans and expirations</p>
              </div>
            </div>
          </div>
          
          {selectedClientPlan ? (
            <div className="main-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => setSelectedClientPlan(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--grey-600)' }}>←</button>
                <h3 style={{ margin: 0 }}>Client Plan Details</h3>
              </div>
              <div className="form-row" style={{ gap: '2rem' }}>
                <div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>Client Name</label><div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedClientPlan.clientName}</div></div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>Plan Name</label><div style={{ fontWeight: 600 }}>{selectedClientPlan.planName}</div></div>
                </div>
                <div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>Expiration Date</label><div style={{ fontWeight: 600 }}>{selectedClientPlan.expirationDate}</div></div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>Status</label>
                    <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: selectedClientPlan.daysLeft <= 3 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: selectedClientPlan.daysLeft <= 3 ? 'var(--danger)' : 'var(--success)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                      {selectedClientPlan.daysLeft} days remaining
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '2rem', padding: '2rem', background: 'var(--grey-100)', borderRadius: '12px', textAlign: 'center', color: 'var(--grey-500)' }}>
                Detailed backend plan tracking analytics will populate here.
              </div>
            </div>
          ) : (
            <>
              <div className="filters-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔍</span>
                  <span style={{ fontWeight: 600, color: 'var(--dark)' }}>Track</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-600)' }}>Plan Name</label>
                    <select className="control-select" value={clientPlanSort} onChange={e => setClientPlanSort(e.target.value)}>
                      <option value="All Plans">All Plans</option>
                      <option value="UMS Plan">UMS Plan</option>
                      <option value="Subscription Plan">Subscription Plan</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-600)' }}>Expiration Status</label>
                    <select className="control-select" value={clientPlanExpirationFilter} onChange={e => setClientPlanExpirationFilter(e.target.value)}>
                      <option value="All">All Ranges</option>
                      <option value="Expiring within 15 days">Expiring within 15 days</option>
                      <option value="Expiring within 10 days">Expiring within 10 days</option>
                      <option value="Expiring within 5 days">Expiring within 5 days</option>
                      <option value="Expiring within 1 day">Expiring within 1 day</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="main-card" style={{ padding: '1rem', marginTop: '1.5rem' }}>
                {filteredClientPlans.length === 0 ? (
                  <EmptyState icon="📋" title="No client plans found." subtitle="Add clients to start tracking their plans." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredClientPlans.map(p => (
                      <div key={p.id} onClick={() => setSelectedClientPlan(p)} style={{ padding: '1rem', border: '1px solid var(--grey-200)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'var(--dark)' }}>{p.clientName}</div>
                          <div style={{ color: 'var(--grey-600)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{p.planName}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: p.daysLeft !== null && p.daysLeft <= 3 ? 'var(--danger)' : 'var(--dark)', fontWeight: 600 }}>
                            Expiring In: {p.daysLeft !== null ? `${p.daysLeft} Days` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    if (currentSection === 'my-profile') {
      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>My Profile</h2>
            </div>
            <Button variant="secondary" onClick={() => setCurrentSection('complete-profile')}>Edit Profile</Button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="main-card settings-card" style={{ padding: '2rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '1.5rem', borderBottom: '1px solid var(--grey-200)', paddingBottom: '0.75rem' }}>Personal Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
                <div><strong>Name:</strong> {cpName || '—'}</div>
                <div><strong>Age:</strong> {cpAge || '—'}</div>
                <div><strong>Gender:</strong> {cpGender || '—'}</div>
              </div>
            </div>

            <div className="main-card settings-card" style={{ padding: '2rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '1.5rem', borderBottom: '1px solid var(--grey-200)', paddingBottom: '0.75rem' }}>Contact Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
                <div><strong>Phone Number:</strong> {cpPhone || '—'}</div>
                <div><strong>Email Address:</strong> {cpEmail || '—'}</div>
                <div><strong>City:</strong> {cpCity || '—'}</div>
              </div>
            </div>

            <div className="main-card settings-card" style={{ padding: '2rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '1.5rem', borderBottom: '1px solid var(--grey-200)', paddingBottom: '0.75rem' }}>Professional Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
                <div><strong>Coach Name:</strong> {cpCoachName || '—'}</div>
                <div><strong>Experience:</strong> {cpExperience || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (currentSection === 'complete-profile') {
      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('my-profile')} title="Back to Profile" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>Complete Profile</h2>
            </div>
          </div>

          <div className="main-card settings-card" style={{ padding: '2rem' }}>
            <div className="settings-form">
              <div className="form-row">
                <div className="form-field"><label>Name</label><input type="text" value={cpName} onChange={e => setCpName(e.target.value)} placeholder="e.g. John Doe" /></div>
                <div className="form-field"><label>Phone Number</label><input type="tel" value={cpPhone} onChange={e => setCpPhone(e.target.value)} placeholder="e.g. +91 98765 43210" /></div>
              </div>
              <div className="form-row">
                <div className="form-field"><label>Email Address</label><input type="email" value={cpEmail} onChange={e => setCpEmail(e.target.value)} placeholder="e.g. john@example.com" /></div>
                <div className="form-field"><label>Age</label><input type="number" value={cpAge} onChange={e => setCpAge(e.target.value)} placeholder="e.g. 35" /></div>
              </div>
              <div className="form-row">
                <div className="form-field"><label>Gender</label>
                  <select value={cpGender} onChange={e => setCpGender(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: 'var(--white)' }}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-field"><label>City</label><input type="text" value={cpCity} onChange={e => setCpCity(e.target.value)} placeholder="e.g. New York" /></div>
              </div>
              <div className="form-row">
                <div className="form-field"><label>Coach Name</label><input type="text" value={cpCoachName} onChange={e => setCpCoachName(e.target.value)} placeholder="e.g. Gaurav Sharma" /></div>
                <div className="form-field"><label>Experience (Years)</label><input type="text" value={cpExperience} onChange={e => setCpExperience(e.target.value)} placeholder="e.g. 5 Years" /></div>
              </div>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Button variant="primary" onClick={() => setCurrentSection('my-profile')}>Save Profile</Button>
            </div>
          </div>
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="section-content page-enter">
        <EmptyState icon="📋" title="Select a section" subtitle="Please select an option from the sidebar menu." />
      </div>
    );
  };

  return (
    <div className="coach-dashboard">
      <Sidebar role="coach" currentSection={currentSection} onNavigate={handleNavigate} userName={userName} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="dashboard-main">
        <Topbar 
          title={
            currentSection === 'dashboard' ? 'Dashboard' :
            currentSection === 'schedule' ? 'Schedule Session' : 
            currentSection === 'diet-schedule' ? 'Diet Schedule' : 
            currentSection === 'client-plans' ? 'Client Plans' : 
            currentSection.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
          } 
          userName={cpName || userName} 
          onMenuClick={() => setSidebarOpen(true)} 
          onNavigate={handleNavigate}
          notifications={notifications}
          onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
          onApproveSession={handleApproveSession}
          onRejectSession={handleRejectSession}
          role="coach"
        />
        <div className="dashboard-content page-enter">
          {renderContent()}
        </div>
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Profile">
          <div style={{ padding: '1rem 0' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--dark)' }}>Are you sure you want to delete this profile?<br/><br/>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => {
                if (itemToDelete) {
                  if (itemToDelete.type === 'client') { setClients(clients.filter(c => c.id !== itemToDelete.id)); setSelectedClient(null); }
                  if (itemToDelete.type === 'coach') { setCoaches(coaches.filter(c => c.id !== itemToDelete.id)); }
                  if (itemToDelete.type === 'prospect') { setProspects(prospects.filter(c => c.id !== itemToDelete.id)); setSelectedProspect(null); }
                  if (itemToDelete.type === 'referral') { setReferrals(referrals.filter(c => c.id !== itemToDelete.id)); setSelectedReferral(null); }
                }
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
              }}>Delete</Button>
            </div>
          </div>
        </Modal>
        <Modal isOpen={isUpdateSubscriptionModalOpen} onClose={() => setIsUpdateSubscriptionModalOpen(false)} title="Update Subscription">
          <div style={{ padding: '1rem 0' }}>
            <div className="form-field">
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: 'var(--grey-700)', fontSize: '0.9rem' }}>Subscription Start Date</label>
              <input type="date" value={subscriptionStartDate} onChange={e => setSubscriptionStartDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', outline: 'none', cursor: 'text', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: 'var(--white)' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setIsUpdateSubscriptionModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => {
                if (subscriptionStartDate && selectedClient) {
                  const start = new Date(subscriptionStartDate);
                  const expiry = new Date(start);
                  expiry.setMonth(expiry.getMonth() + 1);
                  const expiryDateStr = expiry.toISOString().split('T')[0];
                  setClients(clients.map(c => c.id === selectedClient.id ? {
                    ...c,
                    subscriptionStartDate,
                    subscriptionExpiryDate: expiryDateStr
                  } : c));
                  setSelectedClient({
                    ...selectedClient,
                    subscriptionStartDate,
                    subscriptionExpiryDate: expiryDateStr
                  });
                }
                setIsUpdateSubscriptionModalOpen(false);
                setSubscriptionStartDate('');
              }}>Save</Button>
            </div>
          </div>
        </Modal>
        <Modal isOpen={isEditResultOpen} onClose={() => setIsEditResultOpen(false)} title="Edit Result">
          <div className="settings-form">
            <div className="form-group">
              <label>Client Name</label>
              <input type="text" className="control-input" value={editResultClientName} onChange={e => setEditResultClientName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="control-input" rows={4} value={editResultDescription} onChange={e => setEditResultDescription(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Result Image (Optional)</label>
              <input type="file" className="control-input" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  setEditResultFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setEditResultImage(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }} />
              {editResultImage && (
                <div style={{ marginTop: '1rem', width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--grey-200)' }}>
                  <img src={editResultImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button variant="secondary" fullWidth onClick={() => setIsEditResultOpen(false)}>Cancel</Button>
              <Button variant="primary" fullWidth onClick={async () => {
                if (!editResultClientName) {
                  alert("Please provide a client name");
                  return;
                }
                try {
                  const formData = new FormData();
                  formData.append('clientName', editResultClientName);
                  formData.append('description', editResultDescription);
                  if (editResultFile) {
                    formData.append('image', editResultFile);
                  }
                  const res = await api.editResult(selectedResult.id, formData);
                  if (res.success) {
                    await fetchCoachData();
                    setSelectedResult(res.data ? {
                      id: res.data._id,
                      clientName: res.data.clientName,
                      description: res.data.description,
                      image: res.data.image && res.data.image.secure_url ? res.data.image.secure_url : res.data.image
                    } : null);
                    setIsEditResultOpen(false);
                  }
                } catch (err: any) {
                  alert(err.message || 'Failed to edit result');
                }
              }}>Save Changes</Button>
            </div>
          </div>
        </Modal>
        <Modal isOpen={isDeleteResultConfirmOpen} onClose={() => setIsDeleteResultConfirmOpen(false)} title="Delete Result">
          <div style={{ padding: '1rem 0' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--dark)' }}>Are you sure you want to delete this Result?</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setIsDeleteResultConfirmOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={async () => {
                try {
                  const res = await api.deleteResult(selectedResult.id);
                  if (res.success) {
                    setResults(prev => prev.filter(r => r.id !== selectedResult.id));
                    setSelectedResult(null);
                    setIsDeleteResultConfirmOpen(false);
                  }
                } catch (err: any) {
                  alert(err.message || 'Failed to delete result');
                }
              }}>Delete</Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};
