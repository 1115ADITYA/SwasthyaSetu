import { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import VisitTable from '../components/VisitTable';
import { apiClient } from '../api/client';

interface PatientDetailsPageProps {
  patientId: string;
  patientData?: any;
  onNavigate: (route: string, params?: any) => void;
}

const PatientDetailsPage = ({ patientId, patientData, onNavigate }: PatientDetailsPageProps) => {
  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Using ONLY the existing GET /api/visits/patient/:patientId API
        const response = await apiClient.get(`/api/visits/patient/${patientId}`);
        
        // Map backend format to UI expected format
        const mappedVisits = response.visits.map((visit: any) => ({
          id: visit.id,
          patientId: visit.patientId,
          patientName: patientData?.name || 'Unknown',
          ashaId: visit.recordedById,
          // ASHA Name is not returned by the backend, only phoneNumber and role
          ashaName: visit.recordedBy?.phoneNumber ? `User (${visit.recordedBy.phoneNumber})` : 'Unknown',
          date: visit.createdAt,
          // Reason is not explicitly a backend field. Using notes or first symptom as fallback
          reason: visit.notes || (visit.symptoms && visit.symptoms.length > 0 ? visit.symptoms[0].name : 'Routine Checkup'),
          status: visit.status,
          vitals: visit.vitals || {},
          symptoms: visit.symptoms || []
        }));
        
        setVisits(mappedVisits);
      } catch (err: any) {
        setError(err.message || 'Failed to load patient visits');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (patientId) {
      fetchVisits();
    }
  }, [patientId, patientData]);

  if (!patientData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-slate-600">Patient details unavailable</h2>
        <p className="text-sm text-slate-500 mt-2">Please navigate from the Patients list to load demographics.</p>
        <button onClick={() => onNavigate('patients')} className="mt-4 text-blue-600 hover:underline">Return to Patients</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header & Back Button */}
      <div>
        <button 
          onClick={() => onNavigate('patients')}
          className="flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Patients
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{patientData.name}</h1>
            <p className="text-slate-500 mt-1">Patient ID: {patientData.id}</p>
          </div>
          <StatusBadge status={patientData.riskLevel || 'UNKNOWN'} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Demographics Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 col-span-1">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Demographics</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Age</dt>
              <dd className="font-medium text-slate-900">{patientData.age} years</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Gender</dt>
              <dd className="font-medium text-slate-900">{patientData.gender}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Contact</dt>
              <dd className="font-medium text-slate-900">{patientData.contact}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Location</dt>
              <dd className="font-medium text-slate-900 text-right max-w-[150px] truncate" title={patientData.location}>{patientData.location}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 mt-3">
              <dt className="text-slate-500">System Status</dt>
              <dd><StatusBadge status={patientData.status || 'ACTIVE'} /></dd>
            </div>
          </dl>
        </div>

        {/* Latest Vitals Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 col-span-1 md:col-span-2 flex flex-col justify-center">
           <h3 className="text-lg font-semibold text-slate-800 mb-4">Latest Vitals Overview</h3>
           
           {isLoading ? (
             <div className="flex justify-center items-center py-8">
               <div className="text-slate-500">Loading vitals...</div>
             </div>
           ) : error ? (
             <div className="flex justify-center items-center py-8">
               <div className="text-red-500">Failed to load vitals.</div>
             </div>
           ) : visits.length > 0 && visits[0].vitals && Object.keys(visits[0].vitals).length > 0 ? (
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Blood Pressure</div>
                  <div className="font-semibold text-slate-900">
                    {visits[0].vitals.systolic || '-'}/{visits[0].vitals.diastolic || '-'}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Heart Rate</div>
                  <div className="font-semibold text-slate-900">{visits[0].vitals.heartRate || '-'} bpm</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Temperature</div>
                  <div className="font-semibold text-slate-900">{visits[0].vitals.temperature || '-'}°C</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">SpO2</div>
                  <div className="font-semibold text-slate-900">{visits[0].vitals.spO2 || '-'}%</div>
                </div>
             </div>
           ) : (
             <p className="text-slate-500 italic">No vitals recorded yet.</p>
           )}
        </div>
      </div>

      {/* History */}
      <div>
        {isLoading ? (
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            Loading visit history...
          </div>
        ) : error ? (
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-8 text-center text-red-500">
            {error}
          </div>
        ) : (
          <VisitTable 
            visits={visits} 
            title="Visit History"
            onViewDetails={(id) => {
              const selectedVisit = visits.find(v => v.id === id);
              onNavigate('visit-details', { id, visitData: selectedVisit });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PatientDetailsPage;
