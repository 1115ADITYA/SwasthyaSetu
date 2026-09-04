import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import StatCard from '../components/StatCard';
import PatientTable from '../components/PatientTable';

interface DashboardPageProps {
  onNavigate: (route: string, params?: any) => void;
}

const DashboardPage = ({ onNavigate }: DashboardPageProps) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await apiClient.get('/api/patients');
        // Map backend data to frontend PatientTable format
        const mappedPatients = data.map((p: any) => ({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          dateOfBirth: p.dateOfBirth,
          gender: p.gender,
          location: 'N/A', // Facility not exposed in this endpoint
          status: 'ACTIVE',
          riskLevel: 'UNKNOWN', // Risk level not exposed
          lastVisit: 'N/A' // Need visits API to compute this globally
        }));
        setPatients(mappedPatients);
      } catch (err) {
        console.error("Failed to fetch patients for dashboard", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
        <p className="text-slate-500 mt-1">Here is what's happening in your assigned regions today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Patients" 
          value={isLoading ? '...' : patients.length}
          subtitle="Registered in system" 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          trend="neutral"
          trendValue="Live"
        />
        <StatCard 
          title="Active Patients" 
          value="N/A"
          subtitle="Blocked by backend API" 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          trend="neutral"
          trendValue="0%"
        />
        <StatCard 
          title="Health Visits" 
          value="N/A"
          subtitle="Blocked by backend API" 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
          trend="neutral"
          trendValue="0%"
        />
        <StatCard 
          title="High Risk Patients" 
          value="N/A"
          subtitle="Blocked by backend API" 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          trend="neutral"
          trendValue="0%"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          {isLoading ? (
             <div className="flex-1 flex justify-center items-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             </div>
          ) : (
            <PatientTable 
              patients={patients.slice(0, 4)} 
              onViewPatient={(id) => {
                const selectedPatient = patients.find(p => p.id === id);
                onNavigate('patient-details', { id, patientData: selectedPatient });
              }}
              showViewAll={true}
              onViewAll={() => onNavigate('patients')}
            />
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center text-center">
           <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
           </svg>
           <h3 className="text-lg font-semibold text-slate-700">Recent Health Visits</h3>
           <p className="text-slate-500 mt-2 text-sm max-w-sm">This section is currently blocked. The backend API for global health visits (GET /api/visits) is not yet available.</p>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
