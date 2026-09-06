import { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import HealthVisitsPage from './pages/HealthVisitsPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import SettingsPage from './pages/SettingsPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

// Roles permitted to use the web dashboard
const WEB_ALLOWED_ROLES = ['DOCTOR', 'ADMIN'];

function UnauthorizedView({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h1>
      <p className="text-slate-500 max-w-md">
        The SwasthyaSetu web dashboard is designed for <strong>Doctors</strong> and{' '}
        <strong>Admin/District Officers</strong>. Your account role does not have access to
        this portal.
      </p>
      <p className="text-slate-400 text-sm mt-2">
        If you are an ASHA worker or patient, please use the SwasthyaSetu mobile app.
      </p>
      <button
        onClick={onLogout}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, role, logout } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [routeParams, setRouteParams] = useState<any>({});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-slate-500 text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Enforce role-based access: only DOCTOR and ADMIN can use the web dashboard
  if (role && !WEB_ALLOWED_ROLES.includes(role)) {
    return <UnauthorizedView onLogout={logout} />;
  }

  const handleNavigate = (route: string, params: any = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'patients':
        return <PatientsPage onNavigate={handleNavigate} />;
      case 'patient-details':
        return (
          <PatientDetailsPage
            patientId={routeParams.id}
            patientData={routeParams.patientData}
            onNavigate={handleNavigate}
          />
        );
      case 'visits':
        return <HealthVisitsPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <DashboardLayout currentRoute={currentRoute} onNavigate={handleNavigate}>
      {renderPage()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
