import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const Sidebar = ({ isOpen, toggleSidebar, currentRoute, onNavigate }: SidebarProps) => {
  const { logout } = useAuth();
  const menuItems = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    },
    { 
      id: 'patients', 
      name: 'Patients', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    },
    { 
      id: 'visits', 
      name: 'Health Visits', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
    },
    { 
      id: 'settings', 
      name: 'Settings', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 lg:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:static shadow-sm lg:shadow-none`}>
        <div className="flex items-center justify-start h-16 border-b border-slate-200 px-6 shrink-0">
          <div className="flex items-center gap-2.5 text-blue-700">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 6v6.5c0 5.05 3.81 9.85 9 11.5 5.19-1.65 9-6.45 9-11.5V6l-9-4zm-1 14H9v-2h2v-2h2v2h2v2h-2v2h-2v-2z" />
            </svg>
            <span className="text-xl font-bold tracking-tight">SwasthyaSetu</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden">
          <nav className="p-4 space-y-1">
            <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Administration
            </div>
            {menuItems.map((item) => {
              // Active logic: if we are on patient-details, 'patients' is active.
              const isActive = currentRoute === item.id || (currentRoute === 'patient-details' && item.id === 'patients') || (currentRoute === 'visit-details' && item.id === 'visits');
              
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); toggleSidebar(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'}`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 shrink-0">
            <button 
              onClick={() => logout()}
              className="flex items-center gap-3 px-3 py-2.5 w-full text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors group"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover:text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
