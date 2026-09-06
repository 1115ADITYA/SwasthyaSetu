import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface PatientDetailsPageProps {
  patientId: string;
  patientData?: any; // Optional: pre-loaded from nav state (faster initial render)
  onNavigate: (route: string, params?: any) => void;
}

interface BackendPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  abhaId?: string;
  facilityId: string;
  facility?: { id: string; name: string; location: string; type: string };
  createdAt: string;
}

const PatientDetailsPage = ({ patientId, patientData: navData, onNavigate }: PatientDetailsPageProps) => {
  const [patient, setPatient] = useState<BackendPatient | null>(navData ?? null);
  const [isLoading, setIsLoading] = useState(!navData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Always fetch fresh data from the backend to ensure accuracy,
    // even if navData is pre-populated (it may lack facility join).
    const fetchPatient = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data: BackendPatient = await apiClient.get(`/api/patients/${patientId}`);
        setPatient(data);
      } catch (err: any) {
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          setError('Patient not found.');
        } else {
          setError(err.message || 'Failed to load patient details.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId) {
      fetchPatient();
    } else {
      setError('No patient ID provided.');
      setIsLoading(false);
    }
  }, [patientId]);

  const age =
    patient?.dateOfBirth && !isNaN(new Date(patient.dateOfBirth).getTime())
      ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
      : 'Unknown';

  const formattedDob = patient?.dateOfBirth
    ? new Date(patient.dateOfBirth).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const registeredOn = patient?.createdAt
    ? new Date(patient.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-slate-700">
          {error ?? 'Patient details unavailable'}
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          {!error && 'Please navigate from the Patients list.'}
        </p>
        <button
          onClick={() => onNavigate('patients')}
          className="mt-4 text-blue-600 hover:underline text-sm"
        >
          ← Return to Patients
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('patients')}
          className="flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Patients
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Patient ID: {patient.id}</p>
          </div>
          {patient.abhaId && (
            <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded">
              ABHA: {patient.abhaId}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Demographics */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 col-span-1">
          <h3 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
            Demographics
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Age</dt>
              <dd className="font-medium text-slate-900">{age} years</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Date of Birth</dt>
              <dd className="font-medium text-slate-900">{formattedDob}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Gender</dt>
              <dd className="font-medium text-slate-900">{patient.gender}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 mt-3">
              <dt className="text-slate-500">Registered On</dt>
              <dd className="font-medium text-slate-900">{registeredOn}</dd>
            </div>
          </dl>
        </div>

        {/* Facility Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 col-span-1 md:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
            Assigned Facility
          </h3>
          {patient.facility ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Facility Name</dt>
                <dd className="font-medium text-slate-900">{patient.facility.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Type</dt>
                <dd className="font-medium text-slate-900">{patient.facility.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Location</dt>
                <dd className="font-medium text-slate-900 text-right max-w-[220px]">
                  {patient.facility.location}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-slate-500 text-sm italic">
              Facility information not available.
            </p>
          )}
        </div>
      </div>

      {/* Visit History — Phase 2 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-2">Visit History</h3>
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Phase 2 Feature</p>
            <p className="text-sm text-amber-700 mt-1">
              Visit history will be available once the ASHA offline sync module is deployed.
              The Visit, Vitals, and Symptom data models are planned for Phase 2 and are not
              yet active in this deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsPage;
