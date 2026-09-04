import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentRoute: string;
  onNavigate: (route: string, params?: any) => void;
}

const DashboardLayout = ({ children, currentRoute, onNavigate }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getPageTitle = () => {
    if (currentRoute === 'dashboard') return 'Dashboard Overview';
    if (currentRoute === 'patients') return 'Patient Directory';
    if (currentRoute === 'patient-details') return 'Patient Details';
    if (currentRoute === 'visits') return 'Health Visits';
    if (currentRoute === 'visit-details') return 'Visit Details';
    if (currentRoute === 'settings') return 'Settings';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        currentRoute={currentRoute}
        onNavigate={onNavigate}
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header toggleSidebar={toggleSidebar} pageTitle={getPageTitle()} onNavigate={onNavigate} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
