/**
 * K6 Testing Infrastructure - Global Custom Metrics Registry
 * Defines Trend, Counter, Rate, and Gauge objects for tracking performance characteristics.
 * Uses a consistent prefix convention for all authentication, user identity, dashboard, notifications, sessions, diet plan, referrals, and admin dashboard metrics.
 */

import { Trend, Counter, Rate, Gauge } from 'k6/metrics';

// Standardized Authentication Performance Metrics
export const authLoginDuration = new Trend('auth_login_duration');
export const authLoginSuccess = new Counter('auth_login_success');
export const authLoginFailure = new Counter('auth_login_failure');
export const authLoginFailureRate = new Rate('auth_login_failure_rate');

// Standardized User Identity Performance Metrics (GET /api/auth/me)
export const authGetMeDuration = new Trend('auth_getme_duration');
export const authGetMeSuccess = new Counter('auth_getme_success');
export const authGetMeFailure = new Counter('auth_getme_failure');
export const authGetMeFailureRate = new Rate('auth_getme_failure_rate');

// Standardized Client Dashboard Performance Metrics (GET /api/clients/dashboard)
export const clientDashboardDuration = new Trend('client_dashboard_duration');
export const clientDashboardSuccess = new Counter('client_dashboard_success');
export const clientDashboardFailure = new Counter('client_dashboard_failure');
export const clientDashboardFailureRate = new Rate('client_dashboard_failure_rate');

// Standardized Notifications Performance Metrics (GET /api/notifications)
export const notificationsDuration = new Trend('notifications_duration');
export const notificationsSuccess = new Counter('notifications_success');
export const notificationsFailure = new Counter('notifications_failure');
export const notificationsFailureRate = new Rate('notifications_failure_rate');

// Standardized Sessions Performance Metrics (GET /api/sessions)
export const sessionsDuration = new Trend('sessions_duration');
export const sessionsSuccess = new Counter('sessions_success');
export const sessionsFailure = new Counter('sessions_failure');
export const sessionsFailureRate = new Rate('sessions_failure_rate');

// Standardized Coach Dashboard Performance Metrics (GET /api/coaches/dashboard)
export const coachDashboardDuration = new Trend('coach_dashboard_duration');
export const coachDashboardSuccess = new Counter('coach_dashboard_success');
export const coachDashboardFailure = new Counter('coach_dashboard_failure');
export const coachDashboardFailureRate = new Rate('coach_dashboard_failure_rate');

// Standardized Diet Plan Performance Metrics (GET /api/diet-plans/my-plan)
export const dietPlanDuration = new Trend('dietplan_duration');
export const dietPlanSuccess = new Counter('dietplan_success');
export const dietPlanFailure = new Counter('dietplan_failure');
export const dietPlanFailureRate = new Rate('dietplan_failure_rate');

// Standardized Referrals Performance Metrics (GET /api/referrals)
export const referralsDuration = new Trend('referrals_duration');
export const referralsSuccess = new Counter('referrals_success');
export const referralsFailure = new Counter('referrals_failure');
export const referralsFailureRate = new Rate('referrals_failure_rate');

// Standardized Admin Dashboard Performance Metrics (GET /api/admin/dashboard)
export const adminDashboardDuration = new Trend('admin_dashboard_duration');
export const adminDashboardSuccess = new Counter('admin_dashboard_success');
export const adminDashboardFailure = new Counter('admin_dashboard_failure');
export const adminDashboardFailureRate = new Rate('admin_dashboard_failure_rate');

// Existing generic trends and counters
export const apiRequestDuration = new Trend('api_request_duration');
export const apiFailureRate = new Rate('api_failure_rate');
export const apiRequestCounter = new Counter('api_requests_total');
export const activeSessionsCounter = new Counter('active_sessions_total');
export const activeUsersGauge = new Gauge('active_users');
export const databaseConnectionGauge = new Gauge('database_connections');

export default {
  authLoginDuration,
  authLoginSuccess,
  authLoginFailure,
  authLoginFailureRate,
  authGetMeDuration,
  authGetMeSuccess,
  authGetMeFailure,
  authGetMeFailureRate,
  clientDashboardDuration,
  clientDashboardSuccess,
  clientDashboardFailure,
  clientDashboardFailureRate,
  notificationsDuration,
  notificationsSuccess,
  notificationsFailure,
  notificationsFailureRate,
  sessionsDuration,
  sessionsSuccess,
  sessionsFailure,
  sessionsFailureRate,
  coachDashboardDuration,
  coachDashboardSuccess,
  coachDashboardFailure,
  coachDashboardFailureRate,
  dietPlanDuration,
  dietPlanSuccess,
  dietPlanFailure,
  dietPlanFailureRate,
  referralsDuration,
  referralsSuccess,
  referralsFailure,
  referralsFailureRate,
  adminDashboardDuration,
  adminDashboardSuccess,
  adminDashboardFailure,
  adminDashboardFailureRate,
  apiRequestDuration,
  apiFailureRate,
  apiRequestCounter,
  activeSessionsCounter,
  activeUsersGauge,
  databaseConnectionGauge,
};
