interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const StatCard = ({ title, value, subtitle, icon, trend, trendValue }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
          {icon}
        </div>
      </div>
      
      {(subtitle || trendValue) && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {trendValue && (
            <span className={`font-medium flex items-center ${
              trend === 'up' ? 'text-emerald-600' : 
              trend === 'down' ? 'text-rose-600' : 'text-slate-600'
            }`}>
              {trend === 'up' && (
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              )}
              {trend === 'down' && (
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              )}
              {trendValue}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-500">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
