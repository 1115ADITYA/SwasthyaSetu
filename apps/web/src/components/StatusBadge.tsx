interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStyles = () => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'COMPLETED':
      case 'HEALTHY':
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
      case 'INACTIVE':
      case 'PENDING_REVIEW':
      case 'MONITORING':
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
      case 'HIGH RISK':
      case 'HIGH':
      case 'SEVERE':
        return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10';
      default:
        return 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/10';
    }
  };

  const formattedStatus = status.replace('_', ' ').replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStyles()}`}>
      {formattedStatus}
    </span>
  );
};

export default StatusBadge;
