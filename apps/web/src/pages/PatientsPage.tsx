import { useState, useEffect, useCallback } from 'react';
import PatientTable from '../components/PatientTable';
import SearchBar from '../components/SearchBar';
import { apiClient } from '../api/client';

interface BackendPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  abhaId?: string;
  facilityId: string;
  facility?: { id: string; name: string; location: string; type: string };
}

interface PatientsPageProps {
  onNavigate: (route: string, params?: any) => void;
}

function mapPatient(p: BackendPatient) {
  const birthDate = new Date(p.dateOfBirth);
  const age = isNaN(birthDate.getTime())
    ? 'Unknown'
    : new Date().getFullYear() - birthDate.getFullYear();
  return {
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    age,
    gender: p.gender,
    location: p.facility?.name ?? 'Unknown facility',
    riskLevel: 'UNKNOWN',
    // Keep raw data for navigation
    _raw: p,
  };
}

const PatientsPage = ({ onNavigate }: PatientsPageProps) => {
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [displayedPatients, setDisplayedPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data: BackendPatient[] = await apiClient.get('/api/patients');
        const mapped = data.map(mapPatient);
        setAllPatients(mapped);
        setDisplayedPatients(mapped);
      } catch (err: any) {
        setError(err.message || 'Failed to load patients');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Debounced search using the backend search endpoint
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchTerm(query);
      if (!query.trim()) {
        setDisplayedPatients(allPatients);
        return;
      }
      try {
        setIsSearching(true);
        const data: BackendPatient[] = await apiClient.get(
          `/api/patients/search?q=${encodeURIComponent(query)}`
        );
        setDisplayedPatients(data.map(mapPatient));
      } catch (err: any) {
        // Fallback to client-side filter on error
        setDisplayedPatients(
          allPatients.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase())
          )
        );
      } finally {
        setIsSearching(false);
      }
    },
    [allPatients]
  );

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Patients</h2>
          <p className="text-slate-500 mt-1">Manage and view all registered patients.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <SearchBar
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or ABHA ID..."
        />
        {isSearching && (
          <span className="text-sm text-slate-400 self-center">Searching…</span>
        )}
      </div>

      <div className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-white shadow-sm border border-slate-200 rounded-xl">
            <div className="text-slate-500">Loading patients…</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 bg-white shadow-sm border border-slate-200 rounded-xl">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <PatientTable
            patients={displayedPatients}
            onViewPatient={(id) => {
              const selected = displayedPatients.find((p) => p.id === id);
              onNavigate('patient-details', { id, patientData: selected?._raw ?? null });
            }}
            title={`Showing ${displayedPatients.length} patient${displayedPatients.length !== 1 ? 's' : ''}`}
          />
        )}
      </div>
    </div>
  );
};

export default PatientsPage;
