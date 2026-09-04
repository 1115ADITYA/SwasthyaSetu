import { Patient } from '../data/mockData';
import StatusBadge from './StatusBadge';

interface PatientTableProps {
  patients: Patient[];
  onViewPatient: (id: string) => void;
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const PatientTable = ({ patients, onViewPatient, title = "Patients", showViewAll = false, onViewAll }: PatientTableProps) => {
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
        <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
          <thead className="bg-white text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap">Patient Name</th>
              <th className="px-6 py-4 whitespace-nowrap">Age/Gender</th>
              <th className="px-6 py-4 whitespace-nowrap">Location</th>
              <th className="px-6 py-4 whitespace-nowrap">Risk Level</th>
              <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {patients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No patients found matching your criteria.
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                    {patient.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.age} / {patient.gender}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={patient.riskLevel} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => onViewPatient(patient.id)}
                      className="text-blue-600 hover:text-blue-900 group-hover:underline"
                    >
                      View Details
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

export default PatientTable;
