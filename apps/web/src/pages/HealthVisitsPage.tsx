interface HealthVisitsPageProps {
  onNavigate: (route: string, params?: any) => void;
}

const HealthVisitsPage = ({ onNavigate }: HealthVisitsPageProps) => {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Health Visits</h2>
        <p className="text-slate-500 mt-1">Field visit records submitted by ASHA workers.</p>
      </div>

      {/* Phase 2 Notice */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Visit Sync — Phase 2 Capability
          </h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md">
            Health visit records are captured offline by ASHA field workers using the mobile
            app and synced to the server via{' '}
            <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">
              POST /api/sync/push
            </code>
            . The{' '}
            <strong>Visit</strong>, <strong>Vitals</strong>, and{' '}
            <strong>SyncLog</strong> database models required for this feature are
            planned for Phase 2 and have not yet been deployed.
          </p>
          <p className="text-sm text-slate-500 mt-3 max-w-md">
            Once Phase 2 is complete, this screen will display all visits submitted
            by field workers along with their triage status and vitals.
          </p>
        </div>

        <button
          onClick={() => onNavigate('patients')}
          className="mt-2 inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          View Patients Instead
        </button>
      </div>
    </div>
  );
};

export default HealthVisitsPage;
