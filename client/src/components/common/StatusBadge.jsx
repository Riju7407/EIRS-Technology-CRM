import React from 'react';

const statusMap = {
  // Client statuses
  active: 'badge-success', inactive: 'badge-secondary', lead: 'badge-primary',
  prospect: 'badge-info', churned: 'badge-danger',
  // Follow-up statuses
  scheduled: 'badge-info', 'in-progress': 'badge-warning', completed: 'badge-success',
  cancelled: 'badge-secondary', overdue: 'badge-danger', rescheduled: 'badge-purple',
  // Interaction statuses
  open: 'badge-danger', resolved: 'badge-success', closed: 'badge-secondary',
  escalated: 'badge-warning',
  // Priority
  low: 'badge-secondary', medium: 'badge-info', high: 'badge-warning', critical: 'badge-danger',
  // Purchase
  pending: 'badge-warning', refunded: 'badge-purple',
};

const StatusBadge = ({ value, className = '' }) => {
  const colorClass = statusMap[value] || 'badge-secondary';
  return (
    <span className={`badge ${colorClass} ${className}`}>
      {value?.replace(/-/g, ' ')}
    </span>
  );
};

export default StatusBadge;
