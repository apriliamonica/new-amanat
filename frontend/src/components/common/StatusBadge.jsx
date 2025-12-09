import { STATUS_NAMES, STATUS_CLASSES } from '../../utils/constants';

const StatusBadge = ({ status, size = 'default' }) => {
  const statusClass = STATUS_CLASSES[status] || 'bg-gray-100 text-gray-700';
  const statusName = STATUS_NAMES[status] || status;

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    default: 'px-3 py-1 text-sm',
    large: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${statusClass} ${sizeClasses[size]}`}
    >
      {statusName}
    </span>
  );
};

export default StatusBadge;
