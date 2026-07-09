const API_BASE_URL = 'http://localhost:5001/api';

// Helper to get headers with Authorization token
const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Generic fetch wrapper
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  } catch (error: any) {
    console.error(`API Error in ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
  // Authentication
  login: async (phone: string, password: string, role: 'client' | 'coach' | 'admin') => {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, role })
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  register: async (name: string, email: string, password: string, role: 'client' | 'coach') => {
    const data = await fetchAPI('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  logout: async () => {
    try {
      await fetchAPI('/auth/logout', { method: 'POST', headers: getHeaders() });
    } catch (e) {
      console.warn('Logout failed on backend, clearing local storage anyway');
    }
    localStorage.removeItem('token');
  },

  getMe: async () => {
    return fetchAPI('/auth/me', {
      method: 'GET',
      headers: getHeaders()
    });
  },

  // Client-specific APIs
  completeProfile: async (formData: FormData) => {
    return fetchAPI('/clients/profile', {
      method: 'PUT',
      headers: getHeaders(true),
      body: formData
    });
  },

  getClientDashboard: async () => {
    return fetchAPI('/clients/dashboard', {
      method: 'GET',
      headers: getHeaders()
    });
  },

  addBodyParameter: async (metrics: Record<string, any>) => {
    return fetchAPI('/clients/parameters', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(metrics)
    });
  },

  addBodyMeasurement: async (measurements: Record<string, any>) => {
    return fetchAPI('/clients/measurements', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(measurements)
    });
  },

  createReferral: async (referralData: any) => {
    return fetchAPI('/clients/referrals', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(referralData)
    });
  },

  getReferrals: async () => {
    return fetchAPI('/clients/referrals', {
      method: 'GET',
      headers: getHeaders()
    });
  },

  // Sessions
  scheduleSession: async (sessionData: { date: string; time: string; clientPhone?: string; clientId?: string, withParentCoach?: boolean }) => {
    return fetchAPI('/sessions/schedule', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sessionData)
    });
  },

  getSessions: async () => {
    return fetchAPI('/sessions', {
      method: 'GET',
      headers: getHeaders()
    });
  },

  approveSession: async (sessionId: string) => {
    return fetchAPI(`/sessions/${sessionId}/approve`, {
      method: 'PUT',
      headers: getHeaders()
    });
  },

  rejectSession: async (sessionId: string) => {
    return fetchAPI(`/sessions/${sessionId}/reject`, {
      method: 'PUT',
      headers: getHeaders()
    });
  },

  // Diet Plans
  uploadDietPlan: async (data: any) => {
    const isMultipart = data instanceof FormData;
    return fetchAPI('/diet-plans/upload', {
      method: 'POST',
      headers: getHeaders(isMultipart),
      body: isMultipart ? data : JSON.stringify(data)
    });
  },

  getMyDietPlan: async () => {
    return fetchAPI('/diet-plans/my-plan', {
      method: 'GET',
      headers: getHeaders()
    });
  },

  // Coach-specific APIs
  getCoachDashboard: async (filters: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/coaches/dashboard${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
  },

  getClientDetails: async (clientId: string) => {
    return fetchAPI(`/coaches/clients/${clientId}`, {
      method: 'GET',
      headers: getHeaders()
    });
  },

  addClient: async (clientData: any) => {
    return fetchAPI('/coaches/clients', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(clientData)
    });
  },

  addProspect: async (prospectData: any) => {
    return fetchAPI('/prospects', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(prospectData)
    });
  },

  addCoach: async (coachData: any) => {
    return fetchAPI('/coaches/sub-coaches', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(coachData)
    });
  },

  uploadResult: async (resultData: { clientName: string; description: string; file: File }) => {
    const formData = new FormData();
    formData.append('clientName', resultData.clientName);
    formData.append('description', resultData.description);
    if (resultData.file) {
      formData.append('image', resultData.file);
    }
    return fetchAPI('/results', {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
  },

  // Admin-specific APIs
  getAdminDashboard: async (filters: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/admin/dashboard${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });
  },

  updateCoachLevel: async (coachId: string, level: string) => {
    return fetchAPI(`/admin/coaches/${coachId}/level`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ level })
    });
  },

  updateCoachStatus: async (coachId: string, status: string) => {
    return fetchAPI(`/admin/coaches/${coachId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
  },

  // Notifications
  getNotifications: async () => {
    return fetchAPI('/notifications', {
      method: 'GET',
      headers: getHeaders()
    });
  },

  markNotificationRead: async (notifId: string) => {
    return fetchAPI(`/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
  },

    updateClientSubscription: async (clientId: string, data: { subscriptionStartDate: string, subscriptionExpiryDate: string }) => {
    const res = await fetch(`${API_URL}/coach/clients/${clientId}/subscription`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update subscription');
    }
    return res.json();
  },
  updateAdminProfile: async (profileData: any) => {
    return fetchAPI('/admin/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
  },

  editResult: async (resultId: string, formData: FormData) => {
    return fetchAPI(`/results/${resultId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: formData
    });
  },

  deleteResult: async (resultId: string) => {
    return fetchAPI(`/results/${resultId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  deleteCoach: async (coachId: string) => {
    return fetchAPI(`/admin/coaches/${coachId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  deleteClient: async (clientId: string) => {
    return fetchAPI(`/coaches/clients/${clientId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  }
};
