import { useState, useEffect } from 'react';
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
}

interface PatientsPageProps {
  onNavigate: (route: string, params?: any) => void;
}

const PatientsPage = ({ onNavigate }: PatientsPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data: BackendPatient[] = await apiClient.get('/api/patients');
        
        // Map backend data to UI expected format
        const mapped = data.map(p => {
          const birthDate = new Date(p.dateOfBirth);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          return {
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            age: isNaN(age) ? 'Unknown' : age,
            gender: p.gender,
            // The following fields are required by UI but NOT returned by backend GET /api/patients
            location: 'N/A (No facility info)', 
            riskLevel: 'UNKNOWN',
            contact: 'N/A (No contact info)'
          };
        });
        setPatients(mapped);
      } catch (err: any) {
        setError(err.message || 'Failed to load patients');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'ALL' || patient.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Patients</h2>
          <p className="text-slate-500 mt-1">Manage and view all registered patients.</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Patient
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <SearchBar 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Search patients by name..." 
        />
        <select 
          className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
        >
          <option value="ALL">All Risk Levels</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
          <option value="UNKNOWN">Unknown</option>
        </select>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-white shadow-sm border border-slate-200 rounded-xl">
            <div className="text-slate-500">Loading patients...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 bg-white shadow-sm border border-slate-200 rounded-xl">
             <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <PatientTable 
            patients={filteredPatients} 
            onViewPatient={(id) => {
              const selectedPatient = filteredPatients.find(p => p.id === id);
              onNavigate('patient-details', { id, patientData: selectedPatient });
            }} 
            title={`Showing ${filteredPatients.length} patients`}
          />
        )}
      </div>
    </div>
  );
};

export default PatientsPage;
