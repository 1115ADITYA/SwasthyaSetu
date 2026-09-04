import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';

interface HeaderProps {
  toggleSidebar: () => void;
  pageTitle: string;
  onNavigate: (route: string, params?: any) => void;
}

const Header = ({ toggleSidebar, pageTitle, onNavigate }: HeaderProps) => {
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [patientsList, setPatientsList] = useState<any[]>([]);

  // Notification State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const notifRef = useRef<HTMLDivElement>(null);

  // Sanitized static notifications
  const notifications = [
    {
      id: 'welcome-notif',
      title: 'Welcome to SwasthyaSetu',
      message: 'Your web dashboard is ready.',
      time: 'Just now',
      type: 'info',
      onClick: () => {}
    }
  ];

  // Fetch patients for search
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await apiClient.get('/api/patients');
        const mapped = data.map((p: any) => ({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          location: 'N/A' // Not returned by backend
        }));
        setPatientsList(mapped);
      } catch (err) {
        console.error("Failed to load patients for search", err);
      }
    };
    fetchPatients();
  }, []);

  // Search Logic (Frontend filter over fetched data)
  const filteredPatients = patientsList.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3);

  const hasSearchResults = filteredPatients.length > 0;

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 shadow-sm z-20 relative">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <span className="sr-only">Open sidebar</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-slate-800 hidden sm:block tracking-tight">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-5">
        
        {/* Global Search */}
        <div className="relative hidden md:block w-72" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-8 py-2 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim() !== '') setIsSearchOpen(true);
            }}
          />
          {searchQuery && (
             <button 
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
             >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          )}

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
              {!hasSearchResults ? (
                <div className="p-4 text-sm text-slate-500 text-center">No patients found for "{searchQuery}"</div>
              ) : (
                <div className="py-2">
                  <div className="mb-2">
                    <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">Patients</div>
                    <ul>
                      {filteredPatients.map(p => (
                        <li key={p.id}>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            onClick={() => { 
                               setIsSearchOpen(false); 
                               // We route to PatientDetailsPage. 
                               // The user will see a fallback if we don't pass patientData, but since we're pulling from our local patientsList, we can pass it!
                               onNavigate('patient-details', { id: p.id, patientData: p }); 
                            }}
                          >
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-slate-500">ID: {p.id}</div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative"
          >
            <span className="sr-only">View notifications</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-2 ring-white"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => setUnreadCount(0)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                <ul className="divide-y divide-slate-100">
                  {notifications.map((notif, idx) => (
                    <li key={notif.id} className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${idx < unreadCount ? 'bg-blue-50/30' : ''}`} onClick={() => { setIsNotifOpen(false); notif.onClick(); }}>
                      <div className="flex gap-3">
                         <div className={`shrink-0 w-2 h-2 mt-2 rounded-full ${notif.type === 'alert' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                         <div>
                           <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                           <p className="text-sm text-slate-500 mt-0.5">{notif.message}</p>
                           <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                         </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Toggle */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="flex flex-col items-end hidden lg:flex">
            <span className="text-sm font-medium text-slate-700 leading-none">System User</span>
            <span className="text-xs text-slate-500 mt-1">Authorized</span>
          </div>
          <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-shadow">
            <span className="sr-only">Open user menu</span>
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm">
              SU
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
