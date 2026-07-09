import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { Topbar } from '../../components/Topbar/Topbar';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { Toggle } from '../../components/Toggle/Toggle';
import { Button } from '../../components/Button/Button';
import { Modal } from '../../components/Modal/Modal';
import './ClientDashboard.css';

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

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const curDay = now.getDate();
  const curHours = now.getHours();
  const curMinutes = now.getMinutes();

  if (selYear < curYear) return true;
  if (selYear > curYear) return false;

  if (selMonth < curMonth) return true;
  if (selMonth > curMonth) return false;

  if (selDay < curDay) return true;
  if (selDay > curDay) return false;

  if (selHours < curHours) return true;
  if (selHours > curHours) return false;

  if (selMinutes <= curMinutes) return true;
  return false;
};


const metricsOptions = ['Body Weight', 'Body Mass Index (BMI)', 'Body Fat Ratio', 'Muscle Rate', 'Body Water', 'Bone Mass', 'Basal Metabolic Rate', 'Metabolic Age', 'Visceral Fat', 'Subcutaneous Fat', 'Protein Mass', 'Muscle Mass', 'Weight Without Fat'];
const measurementOptions = ['Belly', 'Waist', 'Thigh', 'Chest', 'Arm'];

interface ClientDashboardProps { userName: string; onLogout: () => void; onNavigateApp?: (page: string) => void; profileComplete?: boolean; activeGoal?: string; subscriptionStartDate?: string; profileData?: any; }

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ userName, onLogout, onNavigateApp, profileComplete, activeGoal, subscriptionStartDate, profileData }) => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMealTab, setActiveMealTab] = useState(() => localStorage.getItem('activeMealTab') || 'beginner');
  useEffect(() => {
    localStorage.setItem('activeMealTab', activeMealTab);
  }, [activeMealTab]);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['All']);
  const [selectedMeasurements, setSelectedMeasurements] = useState<string[]>(['All']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [upcomingSessions, setUpcomingSessions] = useState<{id?: string, date: string, time: string, title?: string, status?: string}[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, date: string, metric: string, val: number, color: string} | null>(null);
  
  const [parameterHistory, setParameterHistory] = useState<any[]>([]);
  const [currentParams, setCurrentParams] = useState<Record<string, string>>({});
  
  const [measurementHistory, setMeasurementHistory] = useState<any[]>([]);
  const [currentMeasurements, setCurrentMeasurements] = useState<Record<string, string>>({});
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [referrals, setReferrals] = useState<{id: string; name: string; email: string; phone: string; city: string; age: string; gender: string}[]>([]);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [refName, setRefName] = useState('');
  const [refEmail, setRefEmail] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [refCity, setRefCity] = useState('');
  const [refAge, setRefAge] = useState('');
  const [refGender, setRefGender] = useState('');
  const [coachResults, setCoachResults] = useState<any[]>([]);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState<{id: any; text: string; read: boolean}[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>({
    currentWeight: 'N/A',
    activeGoal: 'N/A',
    subscriptionDays: 'N/A',
    upcomingSessionsCount: 0,
    profile: null
  });

  const fetchDashboardData = async () => {
    try {
      const [dashRes, refRes, dietRes, sessionRes, notifRes] = await Promise.all([
        api.getClientDashboard(),
        api.getReferrals(),
        api.getMyDietPlan(),
        api.getSessions(),
        api.getNotifications()
      ]);

      if (dashRes.success && dashRes.data) {
        const d = dashRes.data;
        setDashboardStats({
          currentWeight: d.currentWeight,
          activeGoal: d.activeGoal,
          subscriptionDays: d.subscriptionDays,
          upcomingSessionsCount: (sessionRes.data || []).length
        });

        if (d.parameterHistory) {
          const mapped = d.parameterHistory.map((entry: any) => ({
            date: entry.date,
            isProfileBaseline: entry.isProfileBaseline,
            'Body Weight': entry.bodyWeight || '',
            'Body Mass Index (BMI)': entry.bmi || '',
            'Body Fat Ratio': entry.bodyFatRatio || '',
            'Muscle Rate': entry.muscleRate || '',
            'Body Water': entry.bodyWater || '',
            'Bone Mass': entry.boneMass || '',
            'Basal Metabolic Rate': entry.bmr || '',
            'Metabolic Age': entry.metabolicAge || '',
            'Visceral Fat': entry.visceralFat || '',
            'Subcutaneous Fat': entry.subcutaneousFat || '',
            'Protein Mass': entry.proteinMass || '',
            'Muscle Mass': entry.muscleMass || '',
            'Weight Without Fat': entry.weightWithoutFat || '',
          }));
          setParameterHistory(mapped);
        }

        if (d.measurementHistory) {
          const mapped = d.measurementHistory.map((entry: any) => ({
            date: entry.date,
            isProfileBaseline: entry.isProfileBaseline,
            'Belly': entry.belly || '',
            'Waist': entry.waist || '',
            'Thigh': entry.thigh || '',
            'Chest': entry.chest || '',
            'Arm': entry.arm || '',
          }));
          setMeasurementHistory(mapped);
        }

        if (d.results) {
          setCoachResults(d.results.map((r: any) => ({
            id: r.id || r._id,
            clientName: r.clientName,
            description: r.description,
            image: r.image && r.image.secure_url ? r.image.secure_url : r.image
          })));
        }
      }

      if (sessionRes.success && sessionRes.data) {
        setUpcomingSessions(sessionRes.data);
      }

      if (dietRes.success && dietRes.data) {
        setDietPlan(dietRes.data);
      } else {
        setDietPlan(null);
      }

      if (notifRes.success && notifRes.data) {
        setNotifications(notifRes.data);
      }

      if (refRes.success && refRes.data) {
        setReferrals(refRes.data.map((r: any) => ({
          id: r._id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          city: r.city,
          age: r.age,
          gender: r.gender
        })));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentSection === 'progress') {
      setSelectedMetrics(['All']);
      setSelectedMeasurements(['All']);
    }
  }, [currentSection]);

  const hasDietPlan = !!dietPlan;

  const isTimeSlotInPastForToday = (timeSlot: string) => {
    if (!scheduleDate) return false;
    return isDateTimeInPast(scheduleDate, timeSlot);
  };

  useEffect(() => {
    setScheduleError('');
    if (scheduleDate && scheduleTime) {
      if (isTimeSlotInPastForToday(scheduleTime)) {
        setScheduleTime('');
      }
    }
  }, [scheduleDate, scheduleTime]);

  useEffect(() => {
    if (!isScheduleModalOpen) {
      setScheduleDate('');
      setScheduleTime('');
      setScheduleError('');
    }
  }, [isScheduleModalOpen]);
  
  const getLatestParameter = (key: string) => {
    if (measurementOptions.includes(key)) {
      const entry = [...measurementHistory].reverse().find(e => e[key] !== undefined && e[key] !== '');
      return entry ? entry[key] : null;
    }
    const entry = [...parameterHistory].reverse().find(e => e[key] !== undefined && e[key] !== '');
    return entry ? entry[key] : null;
  };
  
  const handleMetricToggle = (metric: string) => {
    if (metric === 'All') {
      setSelectedMetrics(['All']);
    } else {
      let newSelection = selectedMetrics.filter(m => m !== 'All');
      if (newSelection.includes(metric)) {
        newSelection = newSelection.filter(m => m !== metric);
      } else {
        newSelection.push(metric);
      }
      if (newSelection.length === 0) newSelection = ['Body Weight'];
      setSelectedMetrics(newSelection);
    }
  };

  const handleMeasurementToggle = (measure: string) => {
    if (measure === 'All') {
      setSelectedMeasurements(['All']);
    } else {
      let newSelection = selectedMeasurements.filter(m => m !== 'All');
      if (newSelection.includes(measure)) {
        newSelection = newSelection.filter(m => m !== measure);
      } else {
        newSelection.push(measure);
      }
      if (newSelection.length === 0) newSelection = ['Belly'];
      setSelectedMeasurements(newSelection);
    }
  };

  const renderMultiLineGraph = (data: any[], keys: string[], allKeys: string[]) => {
    const activeKeys = keys.includes('All') ? allKeys : keys;
    const colors = ['#2ECC71', '#3498DB', '#E74C3C', '#F1C40F', '#9B59B6', '#E67E22', '#1ABC9C', '#34495E', '#16A085', '#27AE60', '#2980B9', '#8E44AD', '#D35400'];

    const validData = data.filter(entry => {
      const hasKey = activeKeys.some(k => entry[k] !== undefined && entry[k] !== '');
      if (!hasKey) return false;
      if (startDate && entry.date && entry.date < startDate) return false;
      if (endDate && entry.date && entry.date > endDate) return false;
      return true;
    });

    const metricsData: Record<string, { min: number, max: number, range: number, points: any[] }> = {};
    
    activeKeys.forEach(k => {
      let min = Infinity;
      let max = -Infinity;
      validData.forEach(e => {
        const backendKey = metricToKey[k] || k;
        const val = parseFloat(e[backendKey]);
        if (!isNaN(val)) {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      });
      if (min === Infinity) min = 0;
      if (max === -Infinity) max = 100;
      
      // Pad single-value scenarios so the line sits securely in the middle vertically
      if (min === max) {
         min -= 10;
         max += 10;
      }
      const range = max - min || 1;
      
      const points = validData.map((e, i) => {
        const backendKey = metricToKey[k] || k;
        const val = parseFloat(e[backendKey]);
        if (isNaN(val)) return null;
        const x = validData.length === 1 ? 50 : (i / (validData.length - 1)) * 100;
        const y = 90 - (((val - min) / range) * 80); // 10% padding bottom and top
        return { x, y, val, date: e.date || 'Recent Entry', metric: k };
      }).filter(p => p !== null);

      metricsData[k] = { min, max, range, points };
    });

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }} onMouseLeave={() => setHoveredPoint(null)}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          {/* Horizontal Grid Lines */}
          {[0, 25, 50, 75, 100].map(percent => (
             <line key={percent} x1="0%" y1={`${percent}%`} x2="100%" y2={`${percent}%`} stroke="var(--grey-200)" strokeWidth="1" strokeDasharray="4 4" />
          ))}
          
          {/* Main X/Y Axes */}
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
                  return (
                    <line 
                      key={`line-${i}`} 
                      x1={`${prev.x}%`} y1={`${prev.y}%`} 
                      x2={`${p.x}%`} y2={`${p.y}%`} 
                      stroke={color} strokeWidth="3" 
                      strokeLinecap="round" strokeLinejoin="round" 
                    />
                  );
                })}
                {/* Single value dot case (if only 1 data point exists, draw a flat horizontal line) */}
                {pts.length === 1 && (
                    <line 
                      x1="0%" y1={`${pts[0].y}%`} 
                      x2="100%" y2={`${pts[0].y}%`} 
                      stroke={color} strokeWidth="2" strokeDasharray="4 4"
                    />
                )}
                {pts.map((p, i) => (
                  <g key={`point-${i}`} 
                     onMouseEnter={() => setHoveredPoint({ ...p, color })}
                     style={{ cursor: 'pointer' }}>
                    <circle cx={`${p.x}%`} cy={`${p.y}%`} r="5" fill="var(--white)" stroke={color} strokeWidth="2" />
                    <circle cx={`${p.x}%`} cy={`${p.y}%`} r="15" fill="transparent" />
                  </g>
                ))}
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            left: `${hoveredPoint.x}%`,
            top: `${hoveredPoint.y}%`,
            transform: 'translate(-50%, -120%)',
            background: 'var(--dark)',
            color: 'var(--white)',
            padding: '0.75rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: 'var(--shadow-lg)',
            pointerEvents: 'none'
          }}>
            <div style={{ marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px' }}>
              <strong>Date:</strong> {hoveredPoint.date}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: hoveredPoint.color }}></span>
              {hoveredPoint.metric}: <strong>{hoveredPoint.val}</strong>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleNavigate = (section: string) => {
    if (section === 'logout') onLogout();
    else setCurrentSection(section);
  };

  const getGreeting = () => {
    const name = userName ? userName.split(' ')[0] : 'Client';
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const handleSaveReferral = async () => {
    if (!refName || !refEmail) return;
    try {
      const res = await api.createReferral({ name: refName, email: refEmail, phone: refPhone, city: refCity, age: refAge, gender: refGender, weightRange: refWeightRange, interest: refInterest });
      if (res.success) {
        await fetchDashboardData();
        setIsReferralModalOpen(false);
        setRefName(''); setRefEmail(''); setRefPhone(''); setRefCity(''); setRefAge(''); setRefGender('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit referral');
    }
  };

  const renderDietPlanDetails = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {dietPlan?.fileUrl && (
          <div style={{ padding: '1rem', border: '1px solid var(--grey-200)', borderRadius: '12px', background: 'var(--off-white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--dark)' }}>🥗 Coach Approved Meal Plan</h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--grey-500)' }}>PDF diet sheet successfully generated and linked by your nutritionist.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => window.open(dietPlan.fileUrl, '_blank')}>Open PDF</Button>
          </div>
        )}
        
        {(() => {
          const planText = activeMealTab === 'weight-loss' ? dietPlan.weightLoss : dietPlan[activeMealTab];
          if (planText) {
            return (
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: 'var(--dark)', fontSize: '0.95rem' }}>
                {planText}
              </div>
            );
          }
          
          if (!dietPlan?.fileUrl) {
            return (
              <div className="meal-empty">
                <EmptyState icon="📝" title="No text plan for this phase" subtitle="Your coach hasn't written a text plan for this specific phase yet." />
              </div>
            );
          }
          return null;
        })()}
      </div>
    );
  };

  const renderContent = () => {
    if (currentSection === 'my-referrals') {
      return (
        <div className="section-content page-enter my-referrals-container">
          <div className="section-header" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>My Referrals</h2>
            </div>
          </div>
          <div className={`main-card my-referrals-card ${referrals.length === 0 ? 'empty-state-card' : ''}`}>
            {referrals.length === 0 ? (
              <div className="my-referrals-empty">
                <div className="my-referrals-empty-icon">🎁</div>
                <h3 className="my-referrals-empty-title">No referrals added yet</h3>
                <p className="my-referrals-empty-subtitle">Invite your friends and family to join NutriCoach.</p>
              </div>
            ) : (
              <div className="referrals-grid">
                {referrals.map(ref => (
                  <div key={ref.id} className="referral-card">
                    <div className="referral-card-header">
                      <div>
                        <h4 className="referral-card-name">{ref.name}</h4>
                        <div className="referral-card-email">{ref.email}</div>
                      </div>
                    </div>
                    <div className="referral-card-details">
                      <div>📞 {ref.phone || '—'}</div>
                      <div>🏙️ {ref.city || '—'}</div>
                      <div>🎂 {ref.age ? `${ref.age} yrs` : '—'}</div>
                      <div>👤 {ref.gender || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => setIsReferralModalOpen(true)}
              className="add-referral-btn">
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add Referral
            </button>
          </div>
        </div>
      );
    }

    if (currentSection === 'coach-results') {
      return (
        <div className="section-content page-enter search-results-container">
          <div className="section-header" style={{ marginBottom: '1.5rem', display: 'block' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark)', margin: 0, lineHeight: 1 }}>Coach Results</h2>
                <p style={{ color: 'var(--grey-500)', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
                  Results generated by your coach will appear here.
                </p>
              </div>
            </div>
          </div>
          <div className={`main-card search-results-card ${coachResults.length === 0 ? 'empty-state-card' : ''}`}>
            {coachResults.length === 0 ? (
              <div className="search-results-empty">
                <div className="search-results-empty-icon">🔍</div>
                <h3 className="search-results-empty-title">No coach results available yet</h3>
                <p className="search-results-empty-subtitle">Once your coach compiles and shares a result, it will be listed here.</p>
              </div>
            ) : (
              <div className="search-results-list">
                {coachResults.map((result: any) => (
                  <div key={result.id} className="search-result-entry">
                    {/* Future coach result display wrapper */}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (currentSection === 'diet-plan') {
      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>My Diet Plan</h2>
            </div>
          </div>
          <div className="meal-tabs">
            {[{ id: 'beginner', label: 'Beginner (1–7 Days)', icon: '🟢' }, { id: 'intermediate', label: 'Intermediate (8–20 Days)', icon: '🟡' }, { id: 'advanced', label: 'Advanced (21+ Days)', icon: '🔴' }, { id: 'weight-loss', label: 'Weight Loss Challenge', icon: '🔥' }].map(meal => (
              <button key={meal.id} className={`meal-tab ${activeMealTab === meal.id ? 'active' : ''}`} onClick={() => setActiveMealTab(meal.id)}>{meal.icon} {meal.label}</button>
            ))}
          </div>
          <div className="diet-card">
            <div className="meal-section-header"><h3>{activeMealTab === 'beginner' ? '🟢 Beginner (1–7 Days)' : activeMealTab === 'intermediate' ? '🟡 Intermediate (8–20 Days)' : activeMealTab === 'advanced' ? '🔴 Advanced (21+ Days)' : '🔥 Weight Loss Challenge'}</h3><span className="meal-calories">{hasDietPlan ? '~ Personalized Plan' : '~ Phase Details'}</span></div>
            {hasDietPlan ? renderDietPlanDetails() : (
              <div className="meal-empty"><EmptyState icon="🥗" title="No diet plan assigned yet" subtitle="Your coach will create a personalized meal plan for you." /></div>
            )}
          </div>
        </div>
      );
    }

    if (currentSection === 'progress') {
      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>Progress & Analytics</h2>
            </div>
          </div>
          <div className="metrics-row">
            {[
              { icon: '⚖️', label: 'Current Weight', value: getLatestParameter('Body Weight') ? `${getLatestParameter('Body Weight')} kg` : (profileData?.bodyWeight ? `${profileData.bodyWeight} kg` : '—') }, 
              { icon: '📊', label: 'BMI', value: getLatestParameter('Body Mass Index (BMI)') || '—' }, 
              { icon: '💪', label: 'Body Fat %', value: getLatestParameter('Body Fat Ratio') ? `${getLatestParameter('Body Fat Ratio')}%` : '—' }
            ].map(m => (
              <div key={m.label} className="metric-card"><div className="metric-icon">{m.icon}</div><div className="metric-text"><div className="metric-label">{m.label}</div><div className="metric-value">{m.value}</div></div></div>
            ))}
          </div>
          <div className="chart-card full-width">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4>Unified Graph System</h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <span style={{ position: 'absolute', pointerEvents: 'none', fontSize: '1.2rem' }}>📅</span>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                </div>
                <span style={{ color: 'var(--grey-400)', fontWeight: 500 }}>-</span>
                <div style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <span style={{ position: 'absolute', pointerEvents: 'none', fontSize: '1.2rem' }}>📅</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {['All', ...metricsOptions].map(metric => (
                <button 
                  key={metric} 
                  className={`meal-tab ${selectedMetrics.includes(metric) ? 'active' : ''}`}
                  onClick={() => handleMetricToggle(metric)}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', margin: 0 }}
                >
                  {metric}
                </button>
              ))}
            </div>
            <div style={{ height: '450px', background: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', marginTop: '1.5rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                {renderMultiLineGraph(parameterHistory, selectedMetrics, metricsOptions)}
              </div>
            </div>
          </div>
          <div className="chart-card full-width">
            <h4>Measurements History</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', marginTop: '1rem' }}>
              <button 
                className={`meal-tab ${selectedMeasurements.includes('All') ? 'active' : ''}`}
                onClick={() => handleMeasurementToggle('All')}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', margin: 0 }}
              >
                All
              </button>
              {measurementOptions.map(measure => (
                <button 
                  key={measure} 
                  className={`meal-tab ${selectedMeasurements.includes(measure) ? 'active' : ''}`}
                  onClick={() => handleMeasurementToggle(measure)}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', margin: 0 }}
                >
                  {measure}
                </button>
              ))}
            </div>
            <div style={{ height: '400px', background: 'var(--white)', border: '1px solid var(--grey-200)', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', marginTop: '1.5rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                {renderMultiLineGraph(measurementHistory, selectedMeasurements, measurementOptions)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (currentSection === 'settings') {
      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>Settings</h2>
            </div>
          </div>
          <div className="settings-tabs">
            {['Profile', 'Notifications'].map(tab => (
              <button key={tab} className={`settings-tab ${settingsTab === tab.toLowerCase().replace(' ', '-') ? 'active' : ''}`} onClick={() => setSettingsTab(tab.toLowerCase().replace(' ', '-'))}>{tab}</button>
            ))}
          </div>
          {settingsTab === 'profile' && (
            <div className="settings-card">
               <div className="avatar-section"><div className="avatar-circle large">{userName.charAt(0).toUpperCase()}</div><Button variant="secondary" size="sm">Change Photo</Button></div>
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-field"><label>Name</label><input type="text" defaultValue={userName} /></div>
                  <div className="form-field"><label>Email Address</label><input type="email" defaultValue="user@example.com" /></div>
                </div>
                <div className="form-row">
                  <div className="form-field"><label>Phone Number</label><input type="tel" defaultValue="" placeholder="+91" /></div>
                  <div className="form-field"><label>Active Goal</label><input type="text" placeholder="e.g., Weight Loss" /></div>
                </div>
                <div style={{ marginTop: '3rem' }}>
                  <Button variant="primary">Save Changes</Button>
                </div>
              </div>
            </div>
          )}
          {settingsTab === 'notifications' && (
            <div className="settings-card">
              <Toggle checked={true} onChange={() => {}} label="Email Updates" description="Receive updates about your progress" />
              <Toggle checked={false} onChange={() => {}} label="Push Notifications" description="Get notified on your device" />
              <Toggle checked={true} onChange={() => {}} label="Session Reminders" description="Reminders for upcoming sessions" />
              <Toggle checked={true} onChange={() => {}} label="Diet Plan Updates" description="When your coach updates your plan" />
              <Toggle checked={false} onChange={() => {}} label="Coach Messages" description="New messages from your coach" />
              <Toggle checked={true} onChange={() => {}} label="Weekly Reports" description="Weekly summary of your progress" />
            </div>
          )}
        </div>
      );
    }

    if (currentSection === 'my-coach') {
      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>My Coach</h2>
            </div>
          </div>
          <div className="coach-empty"><EmptyState icon="👨‍⚕️" title="No coach assigned yet" subtitle="Complete your profile to get matched with a certified nutrition coach." ctaLabel="Find a Coach" onCta={() => {}} /></div>
        </div>
      );
    }

    if (currentSection === 'my-profile') {
      const email = profileData?.emailAddress || '—';
      const phone = profileData?.phoneNumber || '—';
      const userCity = profileData?.city || '—';
      const userAge = profileData?.age || '—';
      const userGender = profileData?.gender || '—';
      const currentWeight = profileData?.bodyWeight ? `${profileData.bodyWeight} kg` : '—';
      const userHeight = profileData?.height ? `${profileData.height} cm` : '—';
      const coach = profileData?.coachName || '—';

      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>My Profile</h2>
              <div style={{ flex: 1 }}></div>
              <Button variant="secondary" onClick={() => onNavigateApp && onNavigateApp('complete-profile')}>Edit Profile</Button>
            </div>
          </div>
          <div className="settings-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="avatar-section" style={{ borderBottom: '1px solid var(--grey-200)', paddingBottom: '2rem', marginBottom: '2rem' }}>
              <div className="avatar-circle large" style={{ fontSize: '2.5rem' }}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--dark)' }}>{userName || 'User Name'}</h3>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--grey-500)' }}>Client Account</p>
              </div>
            </div>
            
            <h4 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', color: 'var(--dark)' }}>Personal Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem 2rem', marginBottom: '3rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Email Address</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{dashboardStats.profile?.email || email}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Phone Number</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{dashboardStats.profile?.phone || phone}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>City</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{dashboardStats.profile?.city || userCity}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Age</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{dashboardStats.profile?.age || userAge}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Gender</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{dashboardStats.profile?.gender || userGender}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Coach Name</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{dashboardStats.profile?.coachName || coach}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Date Joined</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{dashboardStats.profile?.createdAt ? new Date(dashboardStats.profile.createdAt).toLocaleDateString() : '—'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Subscription Status</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{dashboardStats.subscriptionDays}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Allergies</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{dashboardStats.profile?.allergies || '—'}</div>
              </div>
            </div>
            
            <h4 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', color: 'var(--dark)' }}>Body Parameters</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem 2rem', marginBottom: '3rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Current Weight</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{currentWeight}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Height</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{userHeight}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Active Goal</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{activeGoal || '—'}</div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', color: 'var(--dark)' }}>Coach Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem 2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-500)', marginBottom: '0.25rem' }}>Assigned Coach</label>
                <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{coach}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (currentSection === 'my-parameters') {
      return (
        <div className="section-content page-enter">
          <div className="section-header">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>
              <h2 style={{ margin: 0 }}>My Parameters</h2>
            </div>
          </div>
          <div className="settings-card">
            <p style={{ marginBottom: '1.5rem', color: 'var(--grey-500)' }}>Enter your current body parameters. Saving these will update your Progress & Analytics graphs.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
               {metricsOptions.map(metric => (
                 <div key={metric} className="form-field">
                   <label>{metric}</label>
                   <input type="number" placeholder="0" value={currentParams[metric] || ''} onChange={e => setCurrentParams({...currentParams, [metric]: e.target.value})} />
                 </div>
               ))}
            </div>
            <Button variant="primary" onClick={async () => {
               try {
                 const res = await api.addBodyParameter(currentParams);
                 if (res.success) {
                   await fetchDashboardData();
                   setCurrentParams({});
                 }
               } catch (err: any) {
                 alert(err.message || 'Failed to save parameters');
               }
             }}>Save Parameters</Button>

            <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem', color: 'var(--dark)' }}>BODY MEASUREMENTS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
               {measurementOptions.map(measure => (
                 <div key={measure} className="form-field">
                   <label>{measure} Size</label>
                   <input type="number" placeholder="0" value={currentMeasurements[measure] || ''} onChange={e => setCurrentMeasurements({...currentMeasurements, [measure]: e.target.value})} />
                 </div>
               ))}
            </div>
            <Button variant="primary" onClick={async () => {
               try {
                 const res = await api.addBodyMeasurement(currentMeasurements);
                 if (res.success) {
                   await fetchDashboardData();
                   setCurrentMeasurements({});
                 }
               } catch (err: any) {
                 alert(err.message || 'Failed to save measurements');
               }
             }}>Save Measurements</Button>
          </div>
        </div>
      );
    }

    const profileCompletionPercentage = profileComplete ? 100 : ((userName ? 50 : 0) + (activeGoal ? 50 : 0));

    const getSubscriptionStatus = (startDate?: string) => {
      if (!startDate) return 'N/A';
      const start = new Date(startDate);
      const expiry = new Date(start.getTime() + (30 * 24 * 60 * 60 * 1000));
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) return `Expiring in ${diffDays} days`;
      if (diffDays === 0) return 'Expires Today';
      return `Expired ${Math.abs(diffDays)} days ago`;
    };

    // Default Dashboard
    return (
      <div className="dashboard-content page-enter">
        <div className="welcome-banner">
          <h2>{getGreeting()}! 👋</h2>
          <p>Complete your profile to unlock personalized features and get matched with a coach.</p>
          <div className="progress-section">
            <div className="progress-label"><span>Profile completion</span><span>{profileCompletionPercentage}%</span></div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${profileCompletionPercentage}%` }}></div></div>
          </div>
          <Button variant="secondary" onClick={() => onNavigateApp && onNavigateApp('complete-profile')}>Complete Profile →</Button>
        </div>
        <div className="stats-row">
          {[
            { icon: '📅', bgColor: '#EDE7F6', label: 'Sessions Scheduled', value: upcomingSessions.length.toString() }, 
            { icon: '🎯', bgColor: 'var(--green-pale)', label: 'Active Goals', value: activeGoal || '—' }, 
            { icon: '⚖️', bgColor: 'var(--blue-pale)', label: 'Current Weight', value: getLatestParameter('Body Weight') ? `${getLatestParameter('Body Weight')} kg` : (profileData?.bodyWeight ? `${profileData.bodyWeight} kg` : '—') },
            { icon: '💳', bgColor: '#FFF3E0', label: 'Subscription Status', value: getSubscriptionStatus(subscriptionStartDate), isLong: true }
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: s.bgColor }}>{s.icon}</div>
              <div className="stat-text">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={s.isLong ? { fontSize: '1.1rem', lineHeight: '1.3', marginTop: '0.25rem' } : {}}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="content-grid">
          <div className="main-card diet-plan-card" style={{ padding: '2.5rem' }}>
            <div className="card-header"><h3>My Diet Plan</h3></div>
            <div className="meal-tabs">
              {[{ id: 'beginner', label: '🟢 Beginner' }, { id: 'intermediate', label: '🟡 Intermediate' }, { id: 'advanced', label: '🔴 Advanced' }, { id: 'weight-loss', label: '🔥 Weight Loss' }].map(m => (
                <button key={m.id} className={`meal-tab ${activeMealTab === m.id ? 'active' : ''}`} onClick={() => setActiveMealTab(m.id)}>{m.label}</button>
              ))}
            </div>
            {hasDietPlan ? (
              <div style={{ marginTop: '1.5rem' }}>
                {renderDietPlanDetails()}
              </div>
            ) : (
              <EmptyState icon="🥗" title="No diet plan assigned yet" subtitle="Your coach will create a personalized meal plan for you soon." />
            )}
          </div>
          <div className="main-card sessions-card" style={{ display: 'flex', flexDirection: 'column', padding: '2.5rem', gap: '1.5rem' }}>
            <div className="card-header"><h3>Upcoming Sessions</h3><button className="view-all-link" onClick={() => setIsScheduleModalOpen(true)}>Schedule +</button></div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflowY: 'auto' }}>
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session, idx) => (
                  <div key={idx} style={{ padding: '1rem', border: '1px solid var(--grey-200)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '2rem' }}>📅</div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--dark)' }}>{session.title || 'Client Session'}</div>
                      <div style={{ color: 'var(--grey-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{session.date} at {session.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <EmptyState icon="📅" title="No sessions scheduled" subtitle="Book your first consultation with a coach." />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="client-dashboard">
      <Sidebar role="client" currentSection={currentSection} onNavigate={handleNavigate} userName={userName} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="dashboard-main">
        <Topbar 
          title={
            currentSection === 'dashboard' ? 'Overview' : 
            currentSection.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
          } 
          userName={userName} 
          onMenuClick={() => setSidebarOpen(true)} 
          onNavigate={handleNavigate}
          profileComplete={profileComplete}
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
          role="client"
        />
        {renderContent()}
      </main>

      {isScheduleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsScheduleModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--grey-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Schedule Session</h3>
              <button className="modal-close" onClick={() => setIsScheduleModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--grey-500)' }}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
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
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', color: 'var(--grey-700)' }}>Time Slot</label>
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
                  <div 
                    id="schedule-error-msg"
                    style={{ 
                      color: 'var(--danger)', 
                      fontSize: '0.875rem', 
                      marginBottom: '1rem', 
                      fontWeight: 500,
                      textAlign: 'center'
                    }}
                  >
                    {scheduleError}
                  </div>
                )}
                <Button variant="primary" fullWidth onClick={async () => {
                  if (!scheduleDate || !scheduleTime) {
                    setScheduleError("Please select a future date and time.");
                    return;
                  }

                  if (isDateTimeInPast(scheduleDate, scheduleTime)) {
                    setScheduleError("Please select a future date and time.");
                    return;
                  }

                  try {
                    const res = await api.scheduleSession({ date: scheduleDate, time: scheduleTime });
                    if (res.success) {
                      await fetchDashboardData();
                      setIsScheduleModalOpen(false);
                      setScheduleDate('');
                      setScheduleTime('');
                    }
                  } catch (err: any) {
                    setScheduleError(err.message || "Failed to schedule session.");
                  }
                }}>SCHEDULE SESSION</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isReferralModalOpen} onClose={() => setIsReferralModalOpen(false)} title="Add Referral">
        <div className="settings-form">
          <div className="form-field">
            <label>Full Name *</label>
            <input type="text" value={refName} onChange={e => setRefName(e.target.value)} placeholder="Enter full name" />
          </div>
          <div className="form-field">
            <label>Email Address *</label>
            <input type="email" value={refEmail} onChange={e => setRefEmail(e.target.value)} placeholder="Enter email address" />
          </div>
          <div className="form-field">
            <label>Phone Number</label>
            <input type="tel" value={refPhone} onChange={e => setRefPhone(e.target.value)} placeholder="Enter phone number" />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>City</label>
              <input type="text" value={refCity} onChange={e => setRefCity(e.target.value)} placeholder="Enter city" />
            </div>
            <div className="form-field">
              <label>Age</label>
              <input type="number" value={refAge} onChange={e => setRefAge(e.target.value)} placeholder="Age" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Weight Range</label>
              <input type="text" value={refWeightRange} onChange={e => setRefWeightRange(e.target.value)} placeholder="e.g. 70-80 kg" />
            </div>
            <div className="form-field">
              <label>Interest</label>
              <input type="text" value={refInterest} onChange={e => setRefInterest(e.target.value)} placeholder="e.g. Weight Loss" />
            </div>
          </div>
          <div className="form-field">
            <label>Gender</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className={`gender-option ${refGender === 'Male' ? 'selected' : ''}`} 
                onClick={() => setRefGender('Male')} 
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  border: '1.5px solid var(--grey-200)', 
                  borderRadius: 'var(--radius-md)', 
                  background: refGender === 'Male' ? 'var(--dark)' : 'var(--white)', 
                  color: refGender === 'Male' ? 'var(--white)' : 'var(--grey-700)', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  transition: 'all 0.22s var(--ease)' 
                }}>
                Male
              </button>
              <button 
                type="button" 
                className={`gender-option ${refGender === 'Female' ? 'selected' : ''}`} 
                onClick={() => setRefGender('Female')} 
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  border: '1.5px solid var(--grey-200)', 
                  borderRadius: 'var(--radius-md)', 
                  background: refGender === 'Female' ? 'var(--dark)' : 'var(--white)', 
                  color: refGender === 'Female' ? 'var(--white)' : 'var(--grey-700)', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  transition: 'all 0.22s var(--ease)' 
                }}>
                Female
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem', borderTop: '1px solid var(--grey-200)', paddingTop: '1.5rem' }}>
          <Button variant="ghost" onClick={() => setIsReferralModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveReferral} disabled={!refName || !refEmail}>Save Referral</Button>
        </div>
      </Modal>
    </div>
  );
};
