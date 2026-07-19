import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { Topbar } from '../../components/Topbar/Topbar';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { Button } from '../../components/Button/Button';
import { Modal } from '../../components/Modal/Modal';
import { Toggle } from '../../components/Toggle/Toggle';
import './CoachDashboard.css';
import { api } from '../../data/api';
import { navigate, listenToRouteChanges, parseRoute } from '../../utils/navigation';

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

interface CoachDashboardProps { userName: string; onLogout: () => void; profileData?: any; }

const metricsOptions = ['Body Weight', 'Body Mass Index (BMI)', 'Body Fat Ratio', 'Muscle Rate', 'Body Water', 'Bone Mass', 'Basal Metabolic Rate', 'Metabolic Age', 'Visceral Fat', 'Subcutaneous Fat', 'Protein Mass', 'Muscle Mass', 'Weight Without Fat'];
const measurementOptions = ['Belly', 'Waist', 'Thigh', 'Chest', 'Arm'];

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ userName, onLogout, profileData }) => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  // My Clients state
  const [clients, setClients] = useState<{ id: string; name: string; coachName?: string; plan: string; city: string; email?: string; phone?: string; age?: string; gender?: string; weight?: string; height?: string; createdAt?: string; subscriptionStartDate?: string; subscriptionExpiryDate?: string }[]>([]);

  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [parameterHistory, setParameterHistory] = useState<any[]>([]);
  const [measurementHistory, setMeasurementHistory] = useState<any[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['All']);
  const [selectedMeasurements, setSelectedMeasurements] = useState<string[]>(['All']);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);


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
  const [showClientPassword, setShowClientPassword] = useState(false);

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
  const [showCoachPassword, setShowCoachPassword] = useState(false);

  // Filters for Coaches
  const [coachLevelFilter, setCoachLevelFilter] = useState('All');
  const [coachStatusFilter, setCoachStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Sessions state
  const [sessions, setSessions] = useState<{ id: string; type: 'client' | 'coach'; participantName: string; date: string; time: string; status: string; reminded?: boolean; isOrganizer?: boolean }[]>([]);
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
  const [cpName, setCpName] = useState(profileData?.fullName || profileData?.name || userName || '');
  const [cpPhone, setCpPhone] = useState(profileData?.phoneNumber || profileData?.phone || '');
  const [cpEmail, setCpEmail] = useState(profileData?.emailAddress || profileData?.email || '');
  const [cpAge, setCpAge] = useState(profileData?.age || '');
  const [cpGender, setCpGender] = useState(profileData?.gender || '');
  const [cpCity, setCpCity] = useState(profileData?.city || '');
  const [cpCoachName, setCpCoachName] = useState(profileData?.coachName || '');
  const [cpExperience, setCpExperience] = useState(profileData?.experience || '');

  useEffect(() => {
    if (profileData) {
      setCpName(profileData.fullName || profileData.name || userName || '');
      setCpPhone(profileData.phoneNumber || profileData.phone || '');
      setCpEmail(profileData.emailAddress || profileData.email || '');
      setCpAge(profileData.age || '');
      setCpGender(profileData.gender || '');
      setCpCity(profileData.city || '');
      setCpCoachName(profileData.coachName || '');
      setCpExperience(profileData.experience || '');
    }
  }, [profileData, userName]);

  // Settings
  const [coachProfile, setCoachProfile] = useState<{ name: string; email: string; phone: string }>({ name: userName, email: '', phone: '' });
  const [pushNotifications, setPushNotifications] = useState(true);
  const [sessionNotifications, setSessionNotifications] = useState(true);
  const [dietNotifications, setDietNotifications] = useState(true);
  const [resultNotifications, setResultNotifications] = useState(true);
  const [subscriptionNotifications, setSubscriptionNotifications] = useState(true);
  const [marketingNotifications, setMarketingNotifications] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.getNotificationSettings();
        if (res.success && res.data) {
          setPushNotifications(res.data.pushEnabled);
          setSessionNotifications(res.data.sessions);
          setDietNotifications(res.data.dietPlans);
          setResultNotifications(res.data.results);
          setSubscriptionNotifications(res.data.subscriptions);
          setMarketingNotifications(res.data.marketing);
        }
      } catch (e) {
        console.error('Failed to load notification settings:', e);
      }
    };
    loadSettings();
  }, []);

  const handlePushNotificationChange = async (val: boolean) => {
    setPushNotifications(val);
    try {
      await api.updateNotificationSettings({ pushEnabled: val });
    } catch (e) {
      console.error('Failed to update push settings:', e);
    }
  };

  const handleSettingsSubToggle = async (key: string, val: boolean) => {
    if (key === 'sessions') setSessionNotifications(val);
    else if (key === 'dietPlans') setDietNotifications(val);
    else if (key === 'results') setResultNotifications(val);
    else if (key === 'subscriptions') setSubscriptionNotifications(val);
    else if (key === 'marketing') setMarketingNotifications(val);

    try {
      await api.updateNotificationSettings({ [key]: val });
    } catch (e) {
      console.error('Failed to update notification settings sub-toggle:', e);
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(err => {
        console.warn('SW registration failed:', err);
      });
    }

    import('../../firebase').then(({ requestPushPermission, listenForForegroundMessages }) => {
      requestPushPermission(async (token) => {
        try {
          await api.registerFCMToken(token, 'Web', 'Browser', 'Desktop');
        } catch (e) {
          console.error('Failed to register FCM token on backend:', e);
        }
      });

      const unsubscribe = listenForForegroundMessages(() => {
        fetchCoachData();
      });
      return () => unsubscribe();
    });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_SECTION') {
        const url = new URL(event.data.clickAction, window.location.origin);
        const section = url.searchParams.get('section');
        if (section) {
          setCurrentSection(section);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }
    return () => {
      window.removeEventListener('message', handleMessage);
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section) {
      setCurrentSection(section);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
        if (d.referrals) setReferrals(d.referrals.map((r: any) => ({ ...r, weightRange: r.weightRange, interest: r.interest })));
        if (d.coaches) setCoaches(d.coaches);
        if (d.results) {
          setResults(d.results.map((r: any) => ({
            id: r._id || r.id,
            clientName: r.clientName,
            description: r.description,
            image: r.image && r.image.secure_url ? r.image.secure_url : r.image
          })));
        }
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

  // Synchronize router pathname with dashboard internal states
  useEffect(() => {
    const handleRoute = () => {
      const parsed = parseRoute(window.location.pathname, 'coach');
      if (parsed.section && parsed.section !== currentSection) {
        setCurrentSection(parsed.section);
      }
      
      // selectedClient
      if (parsed.section === 'my-clients' && parsed.detailId) {
        const client = clients.find(c => String(c.id) === String(parsed.detailId));
        if (client) {
          setSelectedClient(client);
        } else {
          setSelectedClient({ id: parsed.detailId });
        }
      } else {
        setSelectedClient(null);
      }

      // selectedProspect
      if (parsed.section === 'prospects' && parsed.detailId) {
        const prospect = prospects.find(p => String(p.id) === String(parsed.detailId));
        if (prospect) {
          setSelectedProspect(prospect);
        } else {
          setSelectedProspect({ id: parsed.detailId });
        }
      } else {
        setSelectedProspect(null);
      }

      // selectedClientPlan
      if (parsed.section === 'client-plans' && parsed.detailId) {
        const plan = clients
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
          })
          .find(p => String(p.id) === String(parsed.detailId));
        if (plan) {
          setSelectedClientPlan(plan);
        } else {
          setSelectedClientPlan({ id: parsed.detailId });
        }
      } else {
        setSelectedClientPlan(null);
      }

      // selectedResult
      if (parsed.section === 'results' && parsed.detailId) {
        const result = results.find(r => String(r.id) === String(parsed.detailId));
        if (result) {
          setSelectedResult(result);
        } else {
          setSelectedResult({ id: parsed.detailId, clientName: 'Result Details', description: 'Loading...' });
        }
      } else {
        setSelectedResult(null);
      }

      // selectedReferral
      if (parsed.section === 'referrals' && parsed.detailId) {
        const referral = referrals.find(r => String(r.id) === String(parsed.detailId));
        if (referral) {
          setSelectedReferral(referral);
        } else {
          setSelectedReferral({ id: parsed.detailId });
        }
      } else {
        setSelectedReferral(null);
      }
    };

    handleRoute();

    const unsubscribe = listenToRouteChanges(() => {
      handleRoute();
    });
    return unsubscribe;
  }, [clients, prospects, results, referrals, currentSection]);

  const handleNavigate = (section: string) => {
    if (section === 'logout') {
      onLogout();
    } else {
      let path = '/dashboard';
      if (section === 'my-clients') path = '/clients';
      else if (section === 'my-coaches') path = '/coaches';
      else if (section === 'prospects') path = '/prospects';
      else if (section === 'referrals') path = '/referrals';
      else if (section === 'results') path = '/results';
      else if (section === 'diet-schedule') path = '/diet-plans';
      else if (section === 'client-plans') path = '/client-plans';
      else if (section === 'settings') path = '/settings';
      else if (section === 'messages') path = '/messages';
      else if (section === 'my-profile') path = '/profile';
      else if (section === 'complete-profile') path = '/complete-profile';

      navigate(path);
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

  function getDaysRemaining(expiryStr?: string) {
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

  
  const fetchClientDetails = async (clientId: string) => {
    try {
      const res = await api.getClientDetails(clientId);
      if (res.success && res.data) {
        setClientDetails(res.data.client);
        if (res.data.parameterHistory) {
          setParameterHistory(res.data.parameterHistory.map((entry: any) => ({
            date: entry.date, isProfileBaseline: entry.isProfileBaseline,
            'Body Weight': entry.bodyWeight || '', 'Body Mass Index (BMI)': entry.bmi || '',
            'Body Fat Ratio': entry.bodyFatRatio || '', 'Muscle Rate': entry.muscleRate || '',
            'Body Water': entry.bodyWater || '', 'Bone Mass': entry.boneMass || '',
            'Basal Metabolic Rate': entry.bmr || '', 'Metabolic Age': entry.metabolicAge || '',
            'Visceral Fat': entry.visceralFat || '', 'Subcutaneous Fat': entry.subcutaneousFat || '',
            'Protein Mass': entry.proteinMass || '', 'Muscle Mass': entry.muscleMass || '',
            'Weight Without Fat': entry.weightWithoutFat || '',
          })));
        }
        if (res.data.measurementHistory) {
          setMeasurementHistory(res.data.measurementHistory.map((entry: any) => ({
            date: entry.date, isProfileBaseline: entry.isProfileBaseline,
            'Belly': entry.belly || '', 'Waist': entry.waist || '',
            'Thigh': entry.thigh || '', 'Chest': entry.chest || '',
            'Arm': entry.arm || '',
          })));
        }
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (selectedClient && selectedClient.id) {
      fetchClientDetails(selectedClient.id);
      const interval = setInterval(() => fetchClientDetails(selectedClient.id), 15000);
      return () => clearInterval(interval);
    }
  }, [selectedClient]);

  const handleMetricToggle = (metric: string) => {
    if (metric === 'All') setSelectedMetrics(['All']);
    else {
      let newSelection = selectedMetrics.filter(m => m !== 'All');
      if (newSelection.includes(metric)) newSelection = newSelection.filter(m => m !== metric);
      else newSelection.push(metric);
      if (newSelection.length === 0) newSelection = ['Body Weight'];
      setSelectedMetrics(newSelection);
    }
  };

  const handleMeasurementToggle = (measure: string) => {
    if (measure === 'All') setSelectedMeasurements(['All']);
    else {
      let newSelection = selectedMeasurements.filter(m => m !== 'All');
      if (newSelection.includes(measure)) newSelection = newSelection.filter(m => m !== measure);
      else newSelection.push(measure);
      if (newSelection.length === 0) newSelection = ['Belly'];
      setSelectedMeasurements(newSelection);
    }
  };

  const renderMultiLineGraph = (data: any[], keys: string[], allKeys: string[]) => {
    const activeKeys = keys.includes('All') ? allKeys : keys;
    const colors = ['#2ECC71', '#3498DB', '#E74C3C', '#F1C40F', '#9B59B6', '#E67E22', '#1ABC9C', '#34495E', '#16A085', '#27AE60', '#2980B9', '#8E44AD', '#D35400'];
    const validData = data.filter(entry => activeKeys.some(k => entry[k] !== undefined && entry[k] !== ''));
    const metricsData: Record<string, { min: number, max: number, range: number, points: any[] }> = {};
    activeKeys.forEach(k => {
      let min = Infinity, max = -Infinity;
      validData.forEach(e => {
        const val = parseFloat(e[k]);
        if (!isNaN(val)) { if (val < min) min = val; if (val > max) max = val; }
      });
      if (min === Infinity) min = 0; if (max === -Infinity) max = 100;

      const minRanges: Record<string, number> = {
        'Body Weight': 10,
        'Body Mass Index (BMI)': 3,
        'Body Fat Ratio': 5,
        'Muscle Rate': 5,
        'Body Water': 5,
        'Bone Mass': 0.5,
        'Basal Metabolic Rate': 100,
        'Metabolic Age': 5,
        'Visceral Fat': 2,
        'Subcutaneous Fat': 5,
        'Protein Mass': 5,
        'Muscle Mass': 5,
        'Weight Without Fat': 10,
        'Belly': 5,
        'Waist': 5,
        'Thigh': 3,
        'Chest': 5,
        'Arm': 2
      };

      if (min === max) {
         const pad = minRanges[k] ? minRanges[k] / 2 : 5;
         min -= pad;
         max += pad;
      } else {
         const actualDiff = max - min;
         const targetMinDiff = minRanges[k] || 10;
         if (actualDiff < targetMinDiff) {
           const padding = (targetMinDiff - actualDiff) / 2;
           min -= padding;
           max += padding;
         } else {
           const padding = actualDiff * 0.05;
           min -= padding;
           max += padding;
         }
      }
      const range = max - min || 1;
      const points = validData.map((e, i) => {
        const val = parseFloat(e[k]);
        if (isNaN(val)) return null;
        const x = validData.length === 1 ? 50 : 2 + (i / (validData.length - 1)) * 96;
        const y = 90 - (((val - min) / range) * 80);
        return { x, y, val, date: e.date || 'Recent Entry', metric: k };
      }).filter(p => p !== null);
      metricsData[k] = { min, max, range, points };
    });
    return (
      <div 
        className="graph-scroll-wrapper" 
        style={{ width: '100%', height: '100%', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '1rem' }}
        ref={el => { 
          if (el && el.dataset.scrolled !== validData.length.toString()) { 
            setTimeout(() => {
              if (el) el.scrollLeft = el.scrollWidth;
            }, 100);
            el.dataset.scrolled = validData.length.toString(); 
          } 
        }}
      >
        <div style={{ position: 'relative', minWidth: `max(100%, ${validData.length * 150}px)`, height: '100%' }} onMouseLeave={() => setHoveredPoint(null)}>
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          {[0, 25, 50, 75, 100].map(percent => (
             <line key={percent} x1="0%" y1={`${percent}%`} x2="100%" y2={`${percent}%`} stroke="var(--grey-200)" strokeWidth="1" strokeDasharray="4 4" />
          ))}
          <line x1="0%" y1="100%" x2="100%" y2="100%" stroke="var(--grey-300)" strokeWidth="2" />
          <line x1="0%" y1="0%" x2="0%" y2="100%" stroke="var(--grey-300)" strokeWidth="2" />
          {validData.length > 0 && activeKeys.map((k, idx) => {
            const color = colors[idx % colors.length];
            const pts = metricsData[k].points;
            return (
              <g key={k}>
                {pts.map((p, i) => {
                  if (i === 0) return null;
                  const prev = pts[i - 1];
                  return <line key={`line-${i}`} x1={`${prev.x}%`} y1={`${prev.y}%`} x2={`${p.x}%`} y2={`${p.y}%`} stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
                })}
                {pts.length === 1 && <line x1="0%" y1={`${pts[0].y}%`} x2="100%" y2={`${pts[0].y}%`} stroke={color} strokeWidth="2" strokeDasharray="4 4" />}
                {pts.map((p, i) => (
                  <g key={`point-${i}`} onMouseEnter={() => setHoveredPoint({ ...p, color })} style={{ cursor: 'pointer' }}>
                    <circle cx={`${p.x}%`} cy={`${p.y}%`} r="5" fill="var(--white)" stroke={color} strokeWidth="2" />
                    <circle cx={`${p.x}%`} cy={`${p.y}%`} r="15" fill="transparent" />
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
        {hoveredPoint && (
          <div style={{ position: 'absolute', left: `${hoveredPoint.x}%`, top: `${hoveredPoint.y}%`, transform: hoveredPoint.x > 80 ? 'translate(-100%, -120%)' : hoveredPoint.x < 20 ? 'translate(0%, -120%)' : 'translate(-50%, -120%)', background: 'var(--dark)', color: 'var(--white)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', whiteSpace: 'nowrap', zIndex: 100, boxShadow: 'var(--shadow-lg)', pointerEvents: 'none' }}>
            <div style={{ marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px' }}><strong>Date:</strong> {hoveredPoint.date}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: hoveredPoint.color }}></span>{hoveredPoint.metric}: <strong>{hoveredPoint.val}</strong></div>
          </div>
        )}
        </div>
      </div>
    );
  };

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
              <div className="stat-value">{sessions.filter((s: any) => s.status === 'APPROVED').length}</div>
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
                    const coachObj = coaches.find(c => c.name === scheduleCoach);
                    const res = await api.scheduleSession({
                      date: scheduleDate,
                      time: scheduleTime,
                      clientId: scheduleType === 'client' ? (clientObj ? clientObj.id : undefined) : undefined,
                      withParentCoach: scheduleType === 'parent_coach',
                      targetCoachId: scheduleType === 'coach' ? (coachObj ? coachObj.id : undefined) : undefined
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
                {sessions.filter(s => s.status !== 'REJECTED').length > 0 ? (
                  sessions.filter(s => s.status !== 'REJECTED').map(session => (
                    <div key={session.id} style={{ padding: '1rem', border: '1px solid var(--grey-200)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '2rem' }}>📅</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--dark)', fontSize: '1.1rem' }}>
                          {session.title || (session.type === 'client' ? '1-on-1 Consultation' : 'Coach Session')}
                        </div>
                        <div style={{ color: 'var(--grey-500)', fontSize: '0.95rem', marginTop: '0.5rem', fontWeight: 500 }}>
                          {session.type === 'client' ? 'Client: ' : 'Coach: '} <span style={{ color: 'var(--dark)', fontWeight: 'bold' }}>{session.participantName}</span>
                        </div>
                        <div style={{ color: 'var(--grey-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Date: {session.date}</div>
                        <div style={{ color: 'var(--grey-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Time: {session.time}</div>
                        <div style={{ color: 'var(--grey-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Status: {session.status || 'Scheduled'}</div>
                        {session.status === 'PENDING' && !session.isOrganizer && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <Button variant="green" size="sm" onClick={() => handleApproveSession(session.id)}>Approve</Button>
                            <Button variant="danger" size="sm" onClick={() => handleRejectSession(session.id)}>Reject</Button>
                          </div>
                        )}
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
              <button className="back-to-dashboard-btn" onClick={() => navigate('/clients')} title="Back to Client List" style={{ margin: 0, marginTop: '2px' }}>←</button>
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
                  {clientDetails && <>
                    <div><strong>Email:</strong> {clientDetails.email || '—'}</div>
                    <div><strong>Phone:</strong> {clientDetails.phone || '—'}</div>
                    <div><strong>Age:</strong> {clientDetails.age ? `${clientDetails.age} yrs` : '—'}</div>
                    <div><strong>Gender:</strong> {clientDetails.gender || '—'}</div>
                    <div><strong>Height:</strong> {clientDetails.height ? `${clientDetails.height} ${clientDetails.heightUnit || 'cm'}` : '—'}</div>
                  </>}
                </div>
              </div>

              <div className="main-card" style={{ padding: '2rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)' }}>Active Goal</h4>
                <div style={{ marginTop: '1.25rem', color: 'var(--grey-500)', fontSize: '0.95rem' }}>
                  {clientDetails?.activeGoal || 'No active goal set.'}
                </div>
              </div>



              <div className="main-card" style={{ padding: '2rem', gridColumn: 'span 2' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)' }}>Medical Records</h4>
                <div style={{ marginTop: '1.25rem', color: 'var(--grey-500)', fontSize: '0.95rem' }}>
                  {clientDetails?.medicalPdf ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--off-white)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }}>
                      <span style={{ fontSize: '2rem' }}>📄</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--dark)' }}>Medical Record</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--grey-500)' }}>Uploaded PDF</div>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => {
                        const rawUrl = typeof clientDetails.medicalPdf === 'string' ? clientDetails.medicalPdf : (clientDetails.medicalPdf as any).secure_url;
                        const finalUrl = rawUrl.replace(/\.pdf$/i, '.png');
                        window.open(finalUrl, '_blank');
                      }}>View / Download</Button>
                    </div>
                  ) : (
                    <div>No medical records uploaded.</div>
                  )}
                  {clientDetails?.allergies && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                      <strong>Allergies:</strong> {clientDetails.allergies}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="main-card" style={{ marginTop: '1.5rem', padding: '2rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '1.25rem' }}>Body Parameter Graph</h4>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {['All', ...metricsOptions].map(metric => (
                    <button 
                      key={metric} 
                      onClick={() => handleMetricToggle(metric)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', margin: 0, borderRadius: '4px', border: '1px solid var(--grey-200)', background: selectedMetrics.includes(metric) ? 'var(--dark)' : 'var(--white)', color: selectedMetrics.includes(metric) ? 'var(--white)' : 'var(--grey-700)', cursor: 'pointer' }}
                    >
                      {metric}
                    </button>
                  ))}
                </div>
                <div className="graph-container-box">
                  <div style={{ flex: 1, position: 'relative' }}>
                    {renderMultiLineGraph(parameterHistory, selectedMetrics, metricsOptions)}
                  </div>
                </div>
              </div>
            </div>

            <div className="main-card" style={{ marginTop: '1.5rem', padding: '2rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '1.25rem' }}>Body Measurement Graph</h4>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <button 
                    onClick={() => handleMeasurementToggle('All')}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', margin: 0, borderRadius: '4px', border: '1px solid var(--grey-200)', background: selectedMeasurements.includes('All') ? 'var(--dark)' : 'var(--white)', color: selectedMeasurements.includes('All') ? 'var(--white)' : 'var(--grey-700)', cursor: 'pointer' }}
                  >
                    All
                  </button>
                  {measurementOptions.map(measure => (
                    <button 
                      key={measure} 
                      onClick={() => handleMeasurementToggle(measure)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', margin: 0, borderRadius: '4px', border: '1px solid var(--grey-200)', background: selectedMeasurements.includes(measure) ? 'var(--dark)' : 'var(--white)', color: selectedMeasurements.includes(measure) ? 'var(--white)' : 'var(--grey-700)', cursor: 'pointer' }}
                    >
                      {measure}
                    </button>
                  ))}
                </div>
                <div className="graph-container-box">
                  <div style={{ flex: 1, position: 'relative' }}>
                    {renderMultiLineGraph(measurementHistory, selectedMeasurements, measurementOptions)}
                  </div>
                </div>
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
                <div key={c.id} onClick={() => navigate(`/client/${c.id}`)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem', border: '1px solid var(--grey-200)', borderRadius: '12px', background: 'var(--white)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
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
                <input type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Email Address *</label>
                <input type="email" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Phone Number *</label>
                <input type="text" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>City</label>
                  <input type="text" value={newClientCity} onChange={e => setNewClientCity(e.target.value)} />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Age</label>
                  <input type="number" value={newClientAge} onChange={e => setNewClientAge(e.target.value)} />
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Gender</label>
                  <select className="control-select" value={newClientGender} onChange={e => setNewClientGender(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', backgroundColor: 'var(--white)', color: 'var(--dark)' }}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Current Weight (kg)</label>
                  <input type="number" value={newClientWeight} onChange={e => setNewClientWeight(e.target.value)} />
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Height (cm)</label>
                  <input type="number" value={newClientHeight} onChange={e => setNewClientHeight(e.target.value)} />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Client Plan *</label>
                  <select value={newClientPlan} onChange={e => setNewClientPlan(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: 'var(--white)', color: 'var(--dark)' }}>
                    <option value="">Select Plan</option>
                    <option value="UMS Plan">UMS Plan</option>
                    <option value="Subscription Plan">Subscription Plan</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Password *</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type={showClientPassword ? "text" : "password"} 
                    value={newClientPassword} 
                    onChange={e => setNewClientPassword(e.target.value)} 
                    placeholder="Mandatory password" 
                    style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowClientPassword(!showClientPassword)} 
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grey-500)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {showClientPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
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
              <button className="back-to-dashboard-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {/* Row 1: Clients & Level */}
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ color: 'var(--grey-600)', fontSize: '0.95rem' }}>
                        Clients: <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{c.clientsCount}</span>
                      </div>
                      <div style={{ color: 'var(--grey-600)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Level: <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{c.level}</span></span>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: (c.status || 'active') === 'active' ? 'var(--green)' : '#d97706' }}>
                          {(c.status || 'active') === 'active' ? '🟢' : '🟡'}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Active toggle & Delete Profile buttons */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        style={{ 
                          backgroundColor: (c.status || 'active') === 'active' ? 'var(--green)' : '#f59e0b',
                          color: 'var(--white)',
                          borderColor: (c.status || 'active') === 'active' ? 'var(--green)' : '#f59e0b',
                          width: '120px',
                          justifyContent: 'center'
                        }}
                        onClick={async () => {
                          const newStatus = (c.status || 'active') === 'active' ? 'inactive' : 'active';
                          setCoaches(coaches.map(coach => coach.id === c.id ? { ...coach, status: newStatus } : coach));
                          try {
                            const apiStatus = newStatus === 'active' ? 'Active' : 'Inactive';
                            await api.updateSubcoachStatus(c.id, apiStatus);
                          } catch (err: any) {
                            alert(err.message || 'Failed to update coach status');
                            setCoaches(coaches.map(coach => coach.id === c.id ? { ...coach, status: c.status || 'active' } : coach));
                          }
                        }}
                      >
                        {(c.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => { setItemToDelete({ type: 'coach', id: c.id }); setIsDeleteModalOpen(true); }}
                      >
                        Delete Profile
                      </Button>
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
                <input type="text" value={newCoachName} onChange={e => setNewCoachName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Phone Number *</label>
                  <input type="text" value={newCoachPhone} onChange={e => setNewCoachPhone(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Email Address *</label>
                  <input type="email" value={newCoachEmail} onChange={e => setNewCoachEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>City</label>
                  <input type="text" value={newCoachCity} onChange={e => setNewCoachCity(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Gender</label>
                  <select className="control-select" value={newCoachGender} onChange={e => setNewCoachGender(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', backgroundColor: 'var(--white)', color: 'var(--dark)' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Experience (Years)</label>
                  <input type="text" value={newCoachExperience} onChange={e => setNewCoachExperience(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Level *</label>
                  <select value={newCoachLevel} onChange={e => setNewCoachLevel(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: 'var(--white)', color: 'var(--dark)' }}>
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
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type={showCoachPassword ? "text" : "password"} 
                    value={newCoachPassword} 
                    onChange={e => setNewCoachPassword(e.target.value)} 
                    placeholder="Password for login" 
                    style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '8px', border: '1px solid var(--grey-200)' }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCoachPassword(!showCoachPassword)} 
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grey-500)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {showCoachPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
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
      return (
        <div className="section-content page-enter" style={!selectedProspect ? { position: 'relative', minHeight: 'calc(100vh - 120px)', paddingBottom: '6rem' } : undefined}>
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <button className="back-to-dashboard-btn" onClick={() => selectedProspect ? navigate('/prospects') : navigate('/dashboard')} title="Back" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>{selectedProspect ? 'Prospect Details' : 'Prospects'}</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>{selectedProspect ? 'Detailed prospect contact information' : 'Manage and track incoming leads'}</p>
              </div>
            </div>
          </div>

          {selectedProspect ? (
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
          ) : (
            <>

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
                <div key={p.id} className="coach-list-card" onClick={() => navigate(`/prospect/${p.id}`)}>
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
                <input type="text" value={newProspectName} onChange={e => setNewProspectName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Email *</label>
                <input type="email" value={newProspectEmail} onChange={e => setNewProspectEmail(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Phone Number *</label>
                <input type="tel" value={newProspectPhone} onChange={e => setNewProspectPhone(e.target.value)} />
              </div>
              <div className="form-field">
                <label>City *</label>
                <input type="text" value={newProspectCity} onChange={e => setNewProspectCity(e.target.value)} />
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
                   if (!newProspectName || !newProspectEmail || !newProspectPhone) {
                     alert("Please fill required fields (Name, Email, Phone)");
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
                       setNewProspectName('');
                       setNewProspectEmail('');
                       setNewProspectPhone('');
                       setNewProspectCity('');
                       setNewProspectAge('');
                       setNewProspectWeight('');
                     }
                   } catch (err: any) {
                     alert(err.message || 'Failed to add prospect');
                   }
                 }}>Add Prospect</Button>
              </div>
            </div>
          </Modal>
          </>
          )}
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
              <button className="back-to-dashboard-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
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
              <button className="back-to-dashboard-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>Settings</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '2rem' }}>

            
            <div className="main-card settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark)' }}>Push Notification Settings</h4>
              <Toggle checked={pushNotifications} onChange={handlePushNotificationChange} label="Enable Push Notifications" description="Allow browser/device push notifications" />
              
              <div style={{ borderTop: '1px solid var(--grey-200)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Toggle checked={sessionNotifications} onChange={(val) => handleSettingsSubToggle('sessions', val)} label="Session Reminders" description="Get alerts for upcoming scheduled consultations" disabled={!pushNotifications} />
                <Toggle checked={dietNotifications} onChange={(val) => handleSettingsSubToggle('dietPlans', val)} label="Diet Plan Notifications" description="Get alerts when your coach uploads or updates your diet plans" disabled={!pushNotifications} />
                <Toggle checked={resultNotifications} onChange={(val) => handleSettingsSubToggle('results', val)} label="Result Notifications" description="Get alerts when transformation results are uploaded or updated" disabled={!pushNotifications} />
                <Toggle checked={subscriptionNotifications} onChange={(val) => handleSettingsSubToggle('subscriptions', val)} label="Subscription Reminders" description="Get alerts for subscription expiry and renewals" disabled={!pushNotifications} />
                <Toggle checked={marketingNotifications} onChange={(val) => handleSettingsSubToggle('marketing', val)} label="Marketing Notifications" description="Get optional promotional updates and announcements" disabled={!pushNotifications} />
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
              <button className="back-to-dashboard-btn" onClick={() => selectedReferral ? navigate('/referrals') : navigate('/dashboard')} title="Back" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>{selectedReferral ? 'Referral Details' : 'Referrals'}</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>{selectedReferral ? 'Detailed referral contact information' : 'Track new leads referred by existing clients'}</p>
              </div>
            </div>
          </div>
          {selectedReferral ? (
            <div className="main-card" style={{ padding: '2rem' }}>
              <h3 style={{ margin: 0, marginBottom: '2rem' }}>Referral Details</h3>
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
                <div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>Weight Range</label><div style={{ fontWeight: 600 }}>{selectedReferral.weightRange || 'N/A'}</div></div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ color: 'var(--grey-600)', fontSize: '0.8rem' }}>Interest</label><div style={{ fontWeight: 600 }}>{selectedReferral.interest || 'N/A'}</div></div>
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
                    <div key={r.id} onClick={() => navigate(`/referral/${r.id}`)} style={{ padding: '1rem', border: '1px solid var(--grey-200)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <button className="back-to-dashboard-btn" onClick={() => selectedResult ? navigate('/results') : navigate('/dashboard')} title="Back" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>{selectedResult ? 'Result Details' : 'Results'}</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>{selectedResult ? 'Detailed client transformation result details' : 'Track and showcase client transformations'}</p>
              </div>
            </div>
          </div>
          {selectedResult ? (
            <div className="main-card" style={{ padding: '2rem' }}>
              <h3 style={{ margin: 0, marginBottom: '2rem' }}>Result Details</h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: 'var(--grey-600)', fontSize: '0.8rem', fontWeight: 600 }}>Client Name</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--dark)' }}>{selectedResult.clientName}</div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: 'var(--grey-600)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Description</div>
                <p style={{ margin: 0, color: 'var(--dark)', lineHeight: '1.6' }}>{selectedResult.description}</p>
              </div>
              {selectedResult.image && (
                <div style={{ marginBottom: '2rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--grey-200)', background: 'var(--grey-50)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img src={selectedResult.image} alt="Transformation" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
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
                    <div key={r.id} onClick={() => navigate(`/result/${r.id}`)} style={{ background: 'var(--white)', borderRadius: '12px', border: '1px solid var(--grey-200)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
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
                  style={{ height: '48px', width: '100%', borderRadius: '12px', padding: '0 16px', border: '1px solid var(--grey-200)', backgroundColor: 'var(--white)', color: 'var(--dark)', outline: 'none', color: 'var(--dark)' }} 
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
                  style={{ height: '140px', width: '100%', borderRadius: '12px', padding: '16px', border: '1px solid var(--grey-200)', backgroundColor: 'var(--white)', color: 'var(--dark)', resize: 'vertical', outline: 'none', color: 'var(--dark)' }} 
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
              <button className="back-to-dashboard-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
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
                    className="control-input diet-plan-textarea" 
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
                      backgroundColor: 'var(--white)', color: 'var(--dark)',
                      color: '#000000',
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
                  <div style={{ padding: '1.5rem', backgroundColor: '#FFFFFF', border: '1px solid var(--grey-200)', borderRadius: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#000000', fontSize: '0.95rem' }}>
                    {dietPlans[activeDietCategory] || 'No text entered for this diet plan phase.'}
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
              <button className="back-to-dashboard-btn" onClick={() => selectedClientPlan ? navigate('/client-plans') : navigate('/dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ margin: 0, lineHeight: 1 }}>Client Plans</h2>
                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Track assigned plans and expirations</p>
              </div>
            </div>
          </div>
          
          {selectedClientPlan ? (
            <div className="main-card" style={{ padding: '2rem' }}>
              <h3 style={{ margin: 0, marginBottom: '2rem' }}>Client Plan Details</h3>
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
                      <div key={p.id} onClick={() => navigate(`/client-plan/${p.id}`)} style={{ padding: '1rem', border: '1px solid var(--grey-200)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)' }}>
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
              <button className="back-to-dashboard-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>My Profile</h2>
              <div style={{ flex: 1 }}></div>
              <Button variant="secondary" onClick={() => navigate('/complete-profile')}>Edit Profile</Button>
            </div>
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
              <button className="back-to-dashboard-btn" onClick={() => navigate('/profile')} title="Back to Profile" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>Complete Profile</h2>
            </div>
          </div>

          <div className="main-card settings-card" style={{ padding: '2rem' }}>
            <div className="settings-form">
              <div className="form-row">
                <div className="form-field"><label>Name</label><input type="text" value={cpName} onChange={e => setCpName(e.target.value)} /></div>
                <div className="form-field"><label>Phone Number</label><input type="tel" value={cpPhone} onChange={e => setCpPhone(e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-field"><label>Email Address</label><input type="email" value={cpEmail} onChange={e => setCpEmail(e.target.value)} /></div>
                <div className="form-field"><label>Age</label><input type="number" value={cpAge} onChange={e => setCpAge(e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-field"><label>Gender</label>
                  <select value={cpGender} onChange={e => setCpGender(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: 'var(--white)', color: 'var(--dark)' }}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-field"><label>City</label><input type="text" value={cpCity} onChange={e => setCpCity(e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-field"><label>Coach Name</label><input type="text" value={cpCoachName} onChange={e => setCpCoachName(e.target.value)} /></div>
                <div className="form-field"><label>Experience (Years)</label><input type="text" value={cpExperience} onChange={e => setCpExperience(e.target.value)} /></div>
              </div>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Button variant="primary" onClick={() => navigate('/profile')}>Save Profile</Button>
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
          onMarkAsRead={async (id) => {
            try {
              const res = await api.markNotificationRead(id.toString());
              if (res.success) {
                setNotifications(prev => prev.map(n => (n._id || n.id) === id ? { ...n, read: true } : n));
              }
            } catch (err) {
              console.error(err);
            }
          }}
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
              <input type="date" value={subscriptionStartDate} onChange={e => setSubscriptionStartDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--grey-200)', outline: 'none', cursor: 'text', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: 'var(--white)', color: 'var(--dark)' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setIsUpdateSubscriptionModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => {
                if (subscriptionStartDate && selectedClient) {
                  const start = new Date(subscriptionStartDate);
                  const expiry = new Date(start);
                  expiry.setMonth(expiry.getMonth() + 1);
                  const expiryDateStr = expiry.toISOString().split('T')[0];
                  
                  api.updateClientSubscription(selectedClient.id, {
                    subscriptionStartDate,
                    subscriptionExpiryDate: expiryDateStr
                  }).then(() => {
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
                    setIsUpdateSubscriptionModalOpen(false);
                    setSubscriptionStartDate('');
                  }).catch((err: any) => {
                    alert(err.message || 'Failed to update subscription');
                  });
                } else {
                  setIsUpdateSubscriptionModalOpen(false);
                  setSubscriptionStartDate('');
                }
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
