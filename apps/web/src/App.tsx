import { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import HealthVisitsPage from './pages/HealthVisitsPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import VisitDetailsPage from './pages/VisitDetailsPage';
import SettingsPage from './pages/SettingsPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [routeParams, setRouteParams] = useState<any>({});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (route: string, params: any = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);
    window.scrollTo(0, 0); // Reset scroll on navigation
  };

  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'patients':
        return <PatientsPage onNavigate={handleNavigate} />;
      case 'patient-details':
        return <PatientDetailsPage patientId={routeParams.id} patientData={routeParams.patientData} onNavigate={handleNavigate} />;
      case 'visits':
        return <HealthVisitsPage onNavigate={handleNavigate} />;
      case 'visit-details':
        return <VisitDetailsPage visitId={routeParams.id} visitData={routeParams.visitData} onNavigate={handleNavigate} />;
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
