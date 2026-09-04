import { MOCK_VISITS } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';

interface VisitDetailsPageProps {
  visitId: string;
  visitData?: any;
  onNavigate: (route: string, params?: any) => void;
}

const VisitDetailsPage = ({ visitId, visitData, onNavigate }: VisitDetailsPageProps) => {
  const visit = visitData || MOCK_VISITS.find(v => v.id === visitId);
  
  if (!visit) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-slate-600">Visit details unavailable</h2>
        <p className="text-sm text-slate-500 mt-2">Please navigate from the Visit History list.</p>
        <button onClick={() => onNavigate('visits')} className="mt-4 text-blue-600 hover:underline">Return to Visits</button>
      </div>
    );
  }

  const visitDate = visit.date ? new Date(visit.date).toLocaleString() : 'Unknown Date';
  const vitals = visit.vitals || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <button 
          onClick={() => onNavigate('patient-details', { id: visit.patientId })}
          className="flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Patient
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visit Details</h1>
            <p className="text-slate-500 mt-1">{visitDate}</p>
          </div>
          <div className="flex items-center gap-3">
             <StatusBadge status={visit.status || 'UNKNOWN'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Overview</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex flex-col">
              <dt className="text-slate-500 text-xs uppercase tracking-wider">Patient</dt>
              <dd className="font-medium text-slate-900 mt-1">
                <button onClick={() => onNavigate('patient-details', { id: visit.patientId })} className="text-blue-600 hover:underline">
                  {visit.patientName || 'Unknown Patient'}
                </button>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-slate-500 text-xs uppercase tracking-wider">ASHA Worker</dt>
              <dd className="font-medium text-slate-900 mt-1">{visit.ashaName || 'Unknown ASHA'}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-slate-500 text-xs uppercase tracking-wider">Primary Reason</dt>
              <dd className="font-medium text-slate-900 mt-1">{visit.reason || 'Not specified'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Recorded Vitals</h3>
          {Object.keys(vitals).length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Blood Pressure</div>
                <div className="font-semibold text-slate-900">{vitals.systolic || '-'}/{vitals.diastolic || '-'}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Heart Rate</div>
                <div className="font-semibold text-slate-900">{vitals.heartRate || '-'} bpm</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Temperature</div>
                <div className="font-semibold text-slate-900">{vitals.temperature || '-'}°C</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">SpO2</div>
                <div className="font-semibold text-slate-900">{vitals.spO2 || '-'}%</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Resp. Rate</div>
                <div className="font-semibold text-slate-900">{vitals.respiratoryRate || '-'} /min</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Weight</div>
                <div className="font-semibold text-slate-900">{vitals.weight || '-'} kg</div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No vitals were recorded for this visit.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Symptoms</h3>
        {visit.symptoms && visit.symptoms.length > 0 ? (
          <ul className="space-y-4">
            {visit.symptoms.map((symptom: any, idx: number) => (
              <li key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <h4 className="font-medium text-slate-900">{symptom.name}</h4>
                  {symptom.notes && <p className="text-sm text-slate-500 mt-1">{symptom.notes}</p>}
                </div>
                <div className="mt-2 sm:mt-0 flex flex-col sm:items-end">
                  <StatusBadge status={symptom.severity || 'UNKNOWN'} />
                  <span className="text-xs text-slate-500 mt-1">Duration: {symptom.durationDays || 0} days</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">No specific symptoms recorded for this visit.</p>
        )}
      </div>

    </div>
  );
};

export default VisitDetailsPage;
