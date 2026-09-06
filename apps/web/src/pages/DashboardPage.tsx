import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import PatientTable from '../components/PatientTable';

interface DashboardPageProps {
  onNavigate: (route: string, params?: any) => void;
}

interface Stats {
  totalPatients: number;
  totalFacilities: number;
  countByFacility: Array<{
    facilityId: string;
    facilityName: string;
    facilityLocation: string;
    patientCount: number;
  }>;
}

const DashboardPage = ({ onNavigate }: DashboardPageProps) => {
  const { role } = useAuth();
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch patients and stats in parallel
        const [patientsData, statsData] = await Promise.allSettled([
          apiClient.get('/api/patients'),
          apiClient.get('/api/stats'),
        ]);

        if (patientsData.status === 'fulfilled') {
          const mapped = patientsData.value.map((p: any) => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            age: p.dateOfBirth
              ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
              : 'N/A',
            gender: p.gender,
            location: p.facility?.name ?? 'N/A',
            riskLevel: 'UNKNOWN',
          }));
          setRecentPatients(mapped);
        }

        if (statsData.status === 'fulfilled') {
          setStats(statsData.value);
        } else {
          setStatsError('Stats unavailable for this role.');
        }
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
        <p className="text-slate-500 mt-1">
          {role === 'ADMIN'
            ? 'District-level summary of registered patients and facilities.'
            : "Here is what's happening across the healthcare network today."}
        </p>
      </div>

      {/* Stat Cards — real data from /api/stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Patients"
          value={isLoading ? '…' : stats ? stats.totalPatients : recentPatients.length}
          subtitle="Registered in system"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          trend="neutral"
          trendValue="Live"
        />
        <StatCard
          title="Facilities"
          value={isLoading ? '…' : stats ? stats.totalFacilities : '—'}
          subtitle="PHCs and sub-centres"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          trend="neutral"
          trendValue="Live"
        />
        <StatCard
          title="Health Visits"
          value="Phase 2"
          subtitle="Sync module not yet active"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
          trend="neutral"
          trendValue="Planned"
        />
        <StatCard
          title="Referrals"
          value="Phase 2"
          subtitle="Referral module not yet active"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          trend="neutral"
          trendValue="Planned"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <PatientTable
              patients={recentPatients.slice(0, 5)}
              onViewPatient={(id) => {
                const selected = recentPatients.find((p) => p.id === id);
                onNavigate('patient-details', { id, patientData: selected });
              }}
              showViewAll={true}
              onViewAll={() => onNavigate('patients')}
              title="Recent Patients"
            />
          )}
        </div>

        {/* Per-Facility Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Patients by Facility</h3>
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : statsError ? (
            <p className="text-sm text-slate-500 italic">{statsError}</p>
          ) : stats && stats.countByFacility.length > 0 ? (
            <ul className="space-y-3">
              {stats.countByFacility.map((item) => (
                <li
                  key={item.facilityId}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.facilityName}</p>
                    <p className="text-xs text-slate-500">{item.facilityLocation}</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    {item.patientCount} patients
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">
              No facility data yet. Register patients and assign facilities to see this breakdown.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
