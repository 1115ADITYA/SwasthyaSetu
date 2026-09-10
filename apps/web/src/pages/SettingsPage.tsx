import { useAuth } from '../context/AuthContext';

/**
 * SettingsPage — Profile Information
 *
 * Note on profile data availability:
 * The backend does NOT expose a GET /api/auth/me (or equivalent) endpoint in
 * the current Phase 2 implementation. The login response returns only { token,
 * role }, which is what the AuthContext stores. Phone number, name, and
 * facility information are not available client-side without a new backend
 * endpoint. The "Role" field is populated from real auth data; all other
 * profile fields are displayed as unavailable until an /api/auth/me endpoint
 * is added in a future phase.
 */
const SettingsPage = () => {
  const { role } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your account preferences and notifications.</p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">Profile Information</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role — real value from auth */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <input
                type="text"
                disabled
                value={role ?? '—'}
                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-700 font-medium sm:text-sm"
              />
            </div>
            {/* Phone number — not available without /api/auth/me */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                disabled
                value="Not available"
                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-400 italic sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mt-2">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Limited profile data</p>
              <p className="text-sm text-amber-700 mt-1">
                The backend does not currently expose a <code className="font-mono text-xs bg-amber-100 px-1 rounded">GET /api/auth/me</code> endpoint.
                Only your <strong>Role</strong> is available from the login session.
                Full profile details (name, phone, facility) will be shown once that endpoint is added.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            To update your profile information, please contact the system administrator.
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Email Alerts</h4>
              <p className="text-sm text-slate-500">Receive an email when a High Risk patient is flagged.</p>
            </div>
            <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-blue-600">
              <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200" />
            </button>
          </div>
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Daily Digest</h4>
              <p className="text-sm text-slate-500">Receive a daily summary of all health visits.</p>
            </div>
            <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-slate-200">
              <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
