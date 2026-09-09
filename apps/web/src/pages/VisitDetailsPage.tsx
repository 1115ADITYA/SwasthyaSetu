import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import StatusBadge from '../components/StatusBadge';

interface VisitDetailsPageProps {
  visitId?: string;
  /** Legacy prop — ignored; we always fetch fresh data */
  visitData?: any;
  onNavigate: (route: string, params?: any) => void;
}

interface Vitals {
  temperature?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  heartRate?: number | null;
  spO2?: number | null;
  respiratoryRate?: number | null;
  weight?: number | null;
}

interface Symptom {
  id: string;
  name: string;
  severity: string;
  durationDays: number;
  notes?: string | null;
}

interface Consultation {
  id: string;
  diagnosis: string;
  notes?: string | null;
  treatment?: string | null;
  prescription?: string | null;
  createdAt: string;
  doctor?: { id: string; phoneNumber: string } | null;
}

interface Referral {
  id: string;
  status: string;
  reason: string;
  initiatedAt: string;
  sourceFacility?: { name: string } | null;
  destinationFacility?: { name: string } | null;
}

interface ApiVisit {
  id: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    facility?: { name: string; type: string } | null;
  } | null;
  facility: { id: string; name: string; type: string; location: string } | null;
  asha: { id: string; phoneNumber: string } | null;
  doctor: { id: string; phoneNumber: string } | null;
  visitDate: string;
  reason: string;
  status: string;
  notes?: string | null;
  vitals: Vitals | null;
  symptoms: Symptom[];
  consultation: Consultation | null;
  referral: Referral | null;
}

const fmt = (val: number | null | undefined, suffix = '') =>
  val != null ? `${val}${suffix}` : '—';

const VisitDetailsPage = ({ visitId, onNavigate }: VisitDetailsPageProps) => {
  const [visit, setVisit] = useState<ApiVisit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitId) {
      setError('No visit ID provided.');
      setIsLoading(false);
      return;
    }

    const fetchVisit = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data: ApiVisit = await apiClient.get(`/api/visits/${visitId}`);
        setVisit(data);
      } catch (err: any) {
        if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
          setError('Visit not found.');
        } else {
          setError(err.message || 'Failed to load visit details.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisit();
  }, [visitId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-slate-700">{error ?? 'Visit details unavailable'}</h2>
        {!error && <p className="text-sm text-slate-500 mt-2">Please navigate from the Visit History list.</p>}
        <button onClick={() => onNavigate('visits')} className="mt-4 text-blue-600 hover:underline text-sm">
          ← Return to Visits
        </button>
      </div>
    );
  }

  const visitDate = new Date(visit.visitDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const vitals = visit.vitals;
  const hasVitals = vitals && Object.values(vitals).some((v) => v != null);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <button
          onClick={() =>
            visit.patient
              ? onNavigate('patient-details', { id: visit.patient.id })
              : onNavigate('visits')
          }
          className="flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {visit.patient ? 'Back to Patient' : 'Back to Visits'}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visit Details</h1>
            <p className="text-slate-500 mt-1">{visitDate}</p>
          </div>
          <StatusBadge status={visit.status} />
        </div>
      </div>

      {/* Overview + Facility grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Overview</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex flex-col">
              <dt className="text-slate-500 text-xs uppercase tracking-wider">Patient</dt>
              <dd className="font-medium text-slate-900 mt-1">
                {visit.patient ? (
                  <button
                    onClick={() => onNavigate('patient-details', { id: visit.patient!.id })}
                    className="text-blue-600 hover:underline"
                  >
                    {visit.patient.firstName} {visit.patient.lastName}
                  </button>
                ) : '—'}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-slate-500 text-xs uppercase tracking-wider">ASHA Worker</dt>
              <dd className="font-medium text-slate-900 mt-1">{visit.asha?.phoneNumber ?? '—'}</dd>
            </div>
            {visit.doctor && (
              <div className="flex flex-col">
                <dt className="text-slate-500 text-xs uppercase tracking-wider">Doctor</dt>
                <dd className="font-medium text-slate-900 mt-1">{visit.doctor.phoneNumber}</dd>
              </div>
            )}
            <div className="flex flex-col">
              <dt className="text-slate-500 text-xs uppercase tracking-wider">Primary Reason</dt>
              <dd className="font-medium text-slate-900 mt-1">{visit.reason}</dd>
            </div>
            {visit.notes && (
              <div className="flex flex-col">
                <dt className="text-slate-500 text-xs uppercase tracking-wider">Notes</dt>
                <dd className="text-slate-700 mt-1">{visit.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Facility */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Facility</h3>
          {visit.facility ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium text-slate-900">{visit.facility.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Type</dt>
                <dd className="font-medium text-slate-900">{visit.facility.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Location</dt>
                <dd className="font-medium text-slate-900 text-right max-w-[200px]">{visit.facility.location}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-slate-500 text-sm italic">Facility information not available.</p>
          )}
        </div>
      </div>

      {/* Vitals */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Recorded Vitals</h3>
        {hasVitals ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Blood Pressure', value: vitals!.systolic != null ? `${vitals!.systolic}/${vitals!.diastolic}` : '—', unit: 'mmHg' },
              { label: 'Heart Rate',     value: fmt(vitals!.heartRate),    unit: 'bpm' },
              { label: 'Temperature',   value: fmt(vitals!.temperature),   unit: '°C' },
              { label: 'SpO₂',          value: fmt(vitals!.spO2),          unit: '%' },
              { label: 'Resp. Rate',    value: fmt(vitals!.respiratoryRate), unit: '/min' },
              { label: 'Weight',        value: fmt(vitals!.weight),        unit: 'kg' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className="font-semibold text-slate-900">
                  {value !== '—' ? `${value} ${unit}` : '—'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No vitals were recorded for this visit.</p>
        )}
      </div>

      {/* Symptoms */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Symptoms</h3>
        {visit.symptoms && visit.symptoms.length > 0 ? (
          <ul className="space-y-4">
            {visit.symptoms.map((symptom) => (
              <li
                key={symptom.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div>
                  <h4 className="font-medium text-slate-900">{symptom.name}</h4>
                  {symptom.notes && <p className="text-sm text-slate-500 mt-1">{symptom.notes}</p>}
                </div>
                <div className="mt-2 sm:mt-0 flex flex-col sm:items-end gap-1">
                  <StatusBadge status={symptom.severity} />
                  <span className="text-xs text-slate-500">Duration: {symptom.durationDays} day{symptom.durationDays !== 1 ? 's' : ''}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">No specific symptoms recorded for this visit.</p>
        )}
      </div>

      {/* Consultation */}
      {visit.consultation && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Consultation</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex flex-col">
              <dt className="text-slate-500 text-xs uppercase tracking-wider">Diagnosis</dt>
              <dd className="font-medium text-slate-900 mt-1">{visit.consultation.diagnosis}</dd>
            </div>
            {visit.consultation.treatment && (
              <div className="flex flex-col">
                <dt className="text-slate-500 text-xs uppercase tracking-wider">Treatment</dt>
                <dd className="text-slate-700 mt-1">{visit.consultation.treatment}</dd>
              </div>
            )}
            {visit.consultation.prescription && (
              <div className="flex flex-col">
                <dt className="text-slate-500 text-xs uppercase tracking-wider">Prescription</dt>
                <dd className="text-slate-700 mt-1">{visit.consultation.prescription}</dd>
              </div>
            )}
            {visit.consultation.notes && (
              <div className="flex flex-col">
                <dt className="text-slate-500 text-xs uppercase tracking-wider">Notes</dt>
                <dd className="text-slate-700 mt-1">{visit.consultation.notes}</dd>
              </div>
            )}
            <div className="flex flex-col border-t border-slate-100 pt-3 mt-3">
              <dt className="text-slate-500 text-xs uppercase tracking-wider">Recorded</dt>
              <dd className="text-slate-600 mt-1 text-xs">
                {new Date(visit.consultation.createdAt).toLocaleString('en-IN')}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Referral */}
      {visit.referral && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-base font-semibold text-slate-800">Referral</h3>
            <StatusBadge status={visit.referral.status} />
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">From</dt>
              <dd className="font-medium text-slate-900">{visit.referral.sourceFacility?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">To</dt>
              <dd className="font-medium text-slate-900">{visit.referral.destinationFacility?.name ?? '—'}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-slate-500 text-xs uppercase tracking-wider">Reason</dt>
              <dd className="text-slate-700 mt-1">{visit.referral.reason}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 mt-3">
              <dt className="text-slate-500 text-xs">Initiated</dt>
              <dd className="text-slate-600 text-xs">
                {new Date(visit.referral.initiatedAt).toLocaleDateString('en-IN')}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};

export default VisitDetailsPage;
