export type AppRoute = {
  pathname: string;
  search: string;
  state: any;
};

export interface ParsedRoute {
  pathname: string;
  page: string; // landing, login, signup, forgot-password, complete-profile, client-dashboard, coach-dashboard, admin-dashboard, about, privacy, terms
  section: string; // dashboard, my-clients, coach-performance, my-coaches, prospects, referrals, my-referrals, results, coach-results, diet-schedule, diet-plan, client-plans, my-profile, settings, my-coach, progress, my-parameters
  detailId: string | null;
}

// Custom event name for internal routing updates
export const ROUTE_CHANGE_EVENT = 'nutricoach_route_change';

export function getRoute(): AppRoute {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    state: window.history.state || {}
  };
}

export function navigate(path: string, options?: { replace?: boolean; state?: any }) {
  const currentUrl = window.location.pathname + window.location.search;
  if (currentUrl === path && !options?.state) return;

  const state = {
    ...options?.state,
    authenticated: !!localStorage.getItem('token'),
    timestamp: Date.now()
  };

  if (options?.replace) {
    window.history.replaceState(state, '', path);
  } else {
    window.history.pushState(state, '', path);
  }

  // Dispatch custom event to notify React listeners
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT, { detail: getRoute() }));
}

export function listenToRouteChanges(callback: (route: AppRoute) => void) {
  const handlePopState = () => {
    callback(getRoute());
  };
  const handleCustomRoute = (e: Event) => {
    callback((e as CustomEvent<AppRoute>).detail);
  };

  window.addEventListener('popstate', handlePopState);
  window.addEventListener(ROUTE_CHANGE_EVENT, handleCustomRoute);

  return () => {
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener(ROUTE_CHANGE_EVENT, handleCustomRoute);
  };
}

export function parseRoute(pathname: string, role: 'client' | 'coach' | 'admin' | null): ParsedRoute {
  const cleanPath = pathname === '' ? '/' : pathname;

  // Public/Static pages
  if (cleanPath === '/') return { pathname: cleanPath, page: 'landing', section: '', detailId: null };
  if (cleanPath === '/login') return { pathname: cleanPath, page: 'login', section: '', detailId: null };
  if (cleanPath === '/signup') return { pathname: cleanPath, page: 'signup', section: '', detailId: null };
  if (cleanPath === '/forgot-password') return { pathname: cleanPath, page: 'forgot-password', section: '', detailId: null };
  if (cleanPath === '/complete-profile') return { pathname: cleanPath, page: 'complete-profile', section: '', detailId: null };
  if (cleanPath === '/about') return { pathname: cleanPath, page: 'about', section: '', detailId: null };
  if (cleanPath === '/privacy') return { pathname: cleanPath, page: 'privacy', section: '', detailId: null };
  if (cleanPath === '/terms') return { pathname: cleanPath, page: 'terms', section: '', detailId: null };

  // Dashboard top-level page depends on authenticated role
  let page = 'landing';
  if (role === 'client') page = 'client-dashboard';
  else if (role === 'coach') page = 'coach-dashboard';
  else if (role === 'admin') page = 'admin-dashboard';

  // Dynamic/Authenticated routes
  if (cleanPath === '/dashboard') {
    return { pathname: cleanPath, page, section: 'dashboard', detailId: null };
  }
  if (cleanPath === '/transactions') {
    return { pathname: cleanPath, page, section: 'transactions', detailId: null };
  }
  if (cleanPath === '/clients') {
    return { pathname: cleanPath, page, section: 'my-clients', detailId: null };
  }
  if (cleanPath.startsWith('/client/')) {
    const id = cleanPath.substring('/client/'.length);
    return { pathname: cleanPath, page, section: 'my-clients', detailId: id || null };
  }
  if (cleanPath === '/coaches') {
    let section = 'my-coach';
    if (role === 'coach') section = 'my-coaches';
    else if (role === 'admin') section = 'coach-performance';
    return { pathname: cleanPath, page, section, detailId: null };
  }
  if (cleanPath.startsWith('/coach/')) {
    const id = cleanPath.substring('/coach/'.length);
    let section = 'my-coach';
    if (role === 'coach') section = 'my-coaches';
    else if (role === 'admin') section = 'coach-performance';
    return { pathname: cleanPath, page, section, detailId: id || null };
  }
  if (cleanPath === '/prospects') {
    return { pathname: cleanPath, page, section: 'prospects', detailId: null };
  }
  if (cleanPath.startsWith('/prospect/')) {
    const id = cleanPath.substring('/prospect/'.length);
    return { pathname: cleanPath, page, section: 'prospects', detailId: id || null };
  }
  if (cleanPath === '/referrals') {
    const section = role === 'client' ? 'my-referrals' : 'referrals';
    return { pathname: cleanPath, page, section, detailId: null };
  }
  if (cleanPath.startsWith('/referral/')) {
    const id = cleanPath.substring('/referral/'.length);
    const section = role === 'client' ? 'my-referrals' : 'referrals';
    return { pathname: cleanPath, page, section, detailId: id || null };
  }
  if (cleanPath === '/messages') {
    return { pathname: cleanPath, page, section: 'messages', detailId: null };
  }
  if (cleanPath === '/results') {
    const section = role === 'client' ? 'coach-results' : 'results';
    return { pathname: cleanPath, page, section, detailId: null };
  }
  if (cleanPath.startsWith('/result/')) {
    const id = cleanPath.substring('/result/'.length);
    const section = role === 'client' ? 'coach-results' : 'results';
    return { pathname: cleanPath, page, section, detailId: id || null };
  }
  if (cleanPath === '/diet-plans') {
    const section = role === 'client' ? 'diet-plan' : 'diet-schedule';
    return { pathname: cleanPath, page, section, detailId: null };
  }
  if (cleanPath === '/client-plans') {
    return { pathname: cleanPath, page, section: 'client-plans', detailId: null };
  }
  if (cleanPath.startsWith('/client-plan/')) {
    const id = cleanPath.substring('/client-plan/'.length);
    return { pathname: cleanPath, page, section: 'client-plans', detailId: id || null };
  }
  if (cleanPath === '/analytics' || cleanPath === '/progress') {
    return { pathname: cleanPath, page, section: 'progress', detailId: null };
  }
  if (cleanPath === '/my-parameters') {
    return { pathname: cleanPath, page, section: 'my-parameters', detailId: null };
  }
  if (cleanPath === '/profile') {
    return { pathname: cleanPath, page, section: 'my-profile', detailId: null };
  }
  if (cleanPath === '/settings') {
    return { pathname: cleanPath, page, section: 'settings', detailId: null };
  }
  if (cleanPath === '/payment-history') {
    return { pathname: cleanPath, page, section: 'settings', detailId: 'payment-history' };
  }
  if (cleanPath === '/subscription') {
    return { pathname: cleanPath, page, section: 'settings', detailId: 'subscription' };
  }
  if (cleanPath === '/notifications') {
    return { pathname: cleanPath, page, section: 'dashboard', detailId: 'notifications' };
  }
  if (cleanPath === '/reports') {
    return { pathname: cleanPath, page, section: role === 'client' ? 'progress' : 'dashboard', detailId: 'reports' };
  }

  // Default fallback
  return { pathname: cleanPath, page, section: 'dashboard', detailId: null };
}
