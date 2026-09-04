import { HealthVisit } from '../data/mockData';
import StatusBadge from './StatusBadge';

interface VisitTableProps {
  visits: HealthVisit[];
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onViewDetails: (id: string) => void;
}

const VisitTable = ({ visits, title = "Health Visits", showViewAll = false, onViewAll, onViewDetails }: VisitTableProps) => {
  return (
    <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 shrink-0">
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        {showViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            View All
          </button>
        )}
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm text-slate-600 min-w-[700px]">
          <thead className="bg-white text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap">Patient</th>
              <th className="px-6 py-4 whitespace-nowrap">Date</th>
              <th className="px-6 py-4 whitespace-nowrap">ASHA Worker</th>
              <th className="px-6 py-4 whitespace-nowrap">Reason</th>
              <th className="px-6 py-4 whitespace-nowrap">Status</th>
              <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {visits.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No health visits found.
                </td>
              </tr>
            ) : (
              visits.map((visit) => (
                <tr key={visit.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                    {visit.patientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(visit.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{visit.ashaName}</td>
                  <td className="px-6 py-4 whitespace-nowrap truncate max-w-[200px]" title={visit.reason}>
                    {visit.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={visit.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => onViewDetails(visit.id)}
                      className="text-blue-600 hover:text-blue-900 group-hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VisitTable;
