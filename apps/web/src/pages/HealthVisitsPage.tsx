import { useState } from 'react';
import VisitTable from '../components/VisitTable';
import SearchBar from '../components/SearchBar';
import { MOCK_VISITS } from '../data/mockData';

interface HealthVisitsPageProps {
  onNavigate: (route: string, params?: any) => void;
}

const HealthVisitsPage = ({ onNavigate }: HealthVisitsPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredVisits = MOCK_VISITS.filter(visit => {
    const matchesSearch = visit.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          visit.ashaName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || visit.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Health Visits</h2>
          <p className="text-slate-500 mt-1">Review visits logged by field ASHA workers.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <SearchBar 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Search by patient or ASHA worker name..." 
        />
        <select 
          className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="flex-1">
        <VisitTable 
          visits={filteredVisits} 
          onViewDetails={(id) => onNavigate('visit-details', { id })} 
          title={`Showing ${filteredVisits.length} visits`}
        />
      </div>
    </div>
  );
};

export default HealthVisitsPage;
