import React, { useState, useMemo } from 'react';
import { Modal } from '../../components/Modal/Modal';

interface CoachPerformanceProps {
  coaches: any[];
  clients: any[];
  sessions: any[];
  referrals: any[];
  results: any[];
  onAddCoach: () => void;
  onToggleStatus: (coachId: string) => void;
  onDeleteCoach: (coachId: string) => void;
}

export const CoachPerformance: React.FC<CoachPerformanceProps> = ({
  coaches,
  clients,
  sessions,
  referrals,
  results,
  onAddCoach,
  onToggleStatus,
  onDeleteCoach
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Coach Name (A-Z)');
  const [selectedCoach, setSelectedCoach] = useState<any | null>(null);

  // Calculate metrics for each coach
  const coachesWithMetrics = useMemo(() => {
    return coaches.map(coach => {
      const coachClients = clients.filter(c => c.coachName === coach.name);
      const actualClientCount = coachClients.length > 0 ? coachClients.length : coach.clientsCount || 0;

      // Sessions linked directly to coach or to their clients
      const coachSessions = sessions.filter(s => 
        (s.type === 'coach' && s.participantName === coach.name) ||
        (s.type === 'client' && coachClients.some(c => c.name === s.participantName))
      ).length;

      // Results linked to their clients
      const coachResults = results.filter(r => 
        coachClients.some(c => c.name === r.clientName)
      ).length;

      // Referrals (Assuming if referral has coachName, otherwise 0)
      const coachReferrals = referrals.filter((r: any) => r.coachName === coach.name).length;

      return {
        ...coach,
        calculatedClients: actualClientCount,
        calculatedSessions: coachSessions,
        calculatedReferrals: coachReferrals,
        calculatedResults: coachResults,
        email: coach.email || '—',
        phone: coach.phone || '—',
        city: coach.city || '—',
        gender: coach.gender || '—',
        experience: coach.experience || '—',
        status: coach.status || 'active'
      };
    });
  }, [coaches, clients, sessions, results, referrals]);

  // Derived Summary
  const totalCoaches = coachesWithMetrics.length;
  const activeCoaches = coachesWithMetrics.filter(c => c.status === 'active').length;
  const inactiveCoaches = totalCoaches - activeCoaches;
  const totalClients = coachesWithMetrics.reduce((sum, c) => sum + c.calculatedClients, 0);

  // Filtering
  let filtered = [...coachesWithMetrics].filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(term) || (c.level && c.level.toLowerCase().includes(term));
    
    if (sortBy === 'Active Coaches') {
      return matchesSearch && c.status === 'active';
    }
    if (sortBy === 'Inactive Coaches') {
      return matchesSearch && c.status === 'inactive';
    }
    return matchesSearch;
  });

  // Sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'Level':
        return (a.level || '').localeCompare(b.level || '');
      case 'Coach Name (A-Z)':
      case 'Active Coaches':
      case 'Inactive Coaches':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="section-content page-enter" style={{ position: 'relative', minHeight: 'calc(100vh - 120px)', paddingBottom: '6rem' }}>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, lineHeight: 1 }}>Coach Performance</h2>
          <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Consolidated view of all coaches and their activity metrics</p>
        </div>
      </div>

      <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Coaches</div>
          <div className="stat-value">{totalCoaches}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Coaches</div>
          <div className="stat-value">{activeCoaches}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Inactive Coaches</div>
          <div className="stat-value">{inactiveCoaches}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Clients</div>
          <div className="stat-value">{totalClients}</div>
        </div>
      </div>

      <div className="controls-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button 
          onClick={onAddCoach}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--dark)', color: 'var(--white)', fontWeight: 600, cursor: 'pointer' }}
        >
          + Add Coach
        </button>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Search by Coach Name or Level..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-element"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
          />
        </div>
        <div style={{ minWidth: '200px' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="control-select"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', cursor: 'pointer' }}
          >
            <option value="Coach Name (A-Z)">Sort by: Coach Name (A-Z)</option>
            <option value="Level">Sort by: Level</option>
            <option value="Active Coaches">Sort by: Active Coaches</option>
            <option value="Inactive Coaches">Sort by: Inactive Coaches</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filtered.map(coach => (
          <div
            key={coach.id}
            onClick={() => setSelectedCoach(coach)}
            className="card"
            style={{
              padding: '1rem',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>{coach.name}</h3>
            <p style={{ margin: '0 0 0.75rem 0', opacity: 0.8, fontSize: '0.9rem', fontWeight: 500 }}>{coach.level || 'Coach'}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem', opacity: 0.9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Clients:</span>
                <span style={{ fontWeight: 600 }}>{coach.calculatedClients}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sessions:</span>
                <span style={{ fontWeight: 600 }}>{coach.calculatedSessions}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Referrals:</span>
                <span style={{ fontWeight: 600 }}>{coach.calculatedReferrals}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Results Uploaded:</span>
                <span style={{ fontWeight: 600 }}>{coach.calculatedResults}</span>
              </div>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--grey-200)', fontWeight: 600, color: coach.status === 'active' ? 'var(--green)' : '#d97706' }}>
              Status: {coach.status === 'active' ? 'Active' : 'Inactive'}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--grey-500)' }}>
            No coaches found matching your criteria.
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedCoach} onClose={() => setSelectedCoach(null)} title="Coach Details">
        {selectedCoach && (
          <div style={{ padding: '0.5rem 0 1.5rem 0' }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: 'var(--dark)' }}>{selectedCoach.name}</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--grey-500)', fontSize: '1rem' }}>{selectedCoach.level || 'Coach'}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--grey-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Email</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>{selectedCoach.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--grey-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Phone Number</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>{selectedCoach.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--grey-500)', fontWeight: 600, marginBottom: '0.25rem' }}>City</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>{selectedCoach.city}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--grey-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Gender</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>{selectedCoach.gender}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--grey-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Experience</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--dark)' }}>{selectedCoach.experience}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--grey-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Status</div>
                <div style={{ fontSize: '0.95rem', color: selectedCoach.status === 'active' ? 'var(--green)' : '#d97706', fontWeight: 600 }}>
                  {selectedCoach.status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--dark)' }}>Performance Metrics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div className="stat-card" style={{ padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>{selectedCoach.calculatedClients}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--grey-600)', fontWeight: 500 }}>Number of Clients</div>
              </div>
              <div className="stat-card" style={{ padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>{selectedCoach.calculatedSessions}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--grey-600)', fontWeight: 500 }}>Scheduled Sessions</div>
              </div>
              <div className="stat-card" style={{ padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>{selectedCoach.calculatedReferrals}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--grey-600)', fontWeight: 500 }}>Referrals</div>
              </div>
              <div className="stat-card" style={{ padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>{selectedCoach.calculatedResults}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--grey-600)', fontWeight: 500 }}>Results Uploaded</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--grey-200)', paddingTop: '1.5rem' }}>
              <button 
                onClick={() => {
                  onToggleStatus(selectedCoach.id);
                  setSelectedCoach({ ...selectedCoach, status: selectedCoach.status === 'active' ? 'inactive' : 'active' });
                }}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: `1px solid ${selectedCoach.status === 'active' ? '#f59e0b' : 'var(--green)'}`, background: 'transparent', color: selectedCoach.status === 'active' ? '#f59e0b' : 'var(--green)', fontWeight: 600, cursor: 'pointer' }}
              >
                Mark as {selectedCoach.status === 'active' ? 'Inactive' : 'Active'}
              </button>
              <button 
                onClick={() => {
                  onDeleteCoach(selectedCoach.id);
                  setSelectedCoach(null);
                }}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--danger)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                Delete Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
