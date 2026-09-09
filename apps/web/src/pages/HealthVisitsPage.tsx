import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import StatusBadge from '../components/StatusBadge';

interface HealthVisitsPageProps {
  onNavigate: (route: string, params?: any) => void;
}

interface ApiVisit {
  id: string;
  patientId: string;
  patient: { id: string; firstName: string; lastName: string } | null;
  facilityId: string;
  facility: { id: string; name: string } | null;
  ashaId: string;
  visitDate: string;
  reason: string;
  status: string;
  vitals: any | null;
  symptoms: any[];
}

interface ApiResponse {
  data: ApiVisit[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUS_OPTIONS = ['', 'PENDING_REVIEW', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'];

const HealthVisitsPage = ({ onNavigate }: HealthVisitsPageProps) => {
  const [visits, setVisits] = useState<ApiVisit[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchVisits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const data: ApiResponse = await apiClient.get(`/api/visits?${params.toString()}`);
      setVisits(data.data);
      setMeta(data.meta);
    } catch (err: any) {
      setError(err.message || 'Failed to load visits.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Reset to page 1 when filter changes
  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Health Visits</h2>
          <p className="text-slate-500 mt-1">Field visit records submitted by ASHA workers.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="visits-status-filter"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === '' ? 'All Statuses' : s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Loading */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-600 font-medium">{error}</p>
            <button
              onClick={fetchVisits}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && visits.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-center">
            <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-500 font-medium">No visits found</p>
            {statusFilter && (
              <p className="text-sm text-slate-400">
                Showing filter: <strong>{statusFilter.replace(/_/g, ' ')}</strong>.{' '}
                <button className="text-blue-600 hover:underline" onClick={() => handleStatusChange('')}>
                  Clear filter
                </button>
              </p>
            )}
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && visits.length > 0 && (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Patient</th>
                    <th className="px-6 py-4 whitespace-nowrap">Date</th>
                    <th className="px-6 py-4 whitespace-nowrap">Facility</th>
                    <th className="px-6 py-4 whitespace-nowrap">Reason</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {visit.patient
                          ? `${visit.patient.firstName} ${visit.patient.lastName}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(visit.visitDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {visit.facility?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap truncate max-w-[180px]" title={visit.reason}>
                        {visit.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={visit.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          id={`visit-view-${visit.id}`}
                          onClick={() => onNavigate('visit-details', { id: visit.id })}
                          className="text-blue-600 hover:text-blue-900 group-hover:underline text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                <span>
                  Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={meta.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    ←
                  </button>
                  <button
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HealthVisitsPage;
