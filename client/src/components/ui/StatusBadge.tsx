import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.trim().toLowerCase();

  // Color classes map
  let classes = 'bg-slate-800/80 text-slate-300 border-slate-700/60'; // default gray

  // 1. Blue / Purple: In Progress, Active, Sent, Agreement
  if (
    normalized === 'in progress' ||
    normalized === 'active' ||
    normalized === 'sent' ||
    normalized === 'agreement' ||
    normalized === 'upcoming'
  ) {
    classes = 'bg-indigo-950/40 text-indigo-300 border-indigo-800/50';
  }
  
  // 2. Yellow / Amber: Review, Site Visit, Followed Up, Negotiation, Partial, Enquiry
  else if (
    normalized === 'review' ||
    normalized === 'site visit' ||
    normalized === 'followed up' ||
    normalized === 'negotiation' ||
    normalized === 'partial' ||
    normalized === 'enquiry' ||
    normalized === 'pending'
  ) {
    classes = 'bg-amber-950/40 text-amber-300 border-amber-800/50';
  }
  
  // 3. Green: Completed, Closed, Paid, Won, Available, Sold
  else if (
    normalized === 'completed' ||
    normalized === 'closed' ||
    normalized === 'paid' ||
    normalized === 'won' ||
    normalized === 'available' ||
    normalized === 'sold'
  ) {
    classes = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50';
  }
  
  // 4. Red / Rose: On Hold, Lost, Overdue, Dropped, Inactive, Holiday
  else if (
    normalized === 'on hold' ||
    normalized === 'lost' ||
    normalized === 'overdue' ||
    normalized === 'dropped' ||
    normalized === 'inactive' ||
    normalized === 'holiday'
  ) {
    classes = 'bg-rose-950/40 text-rose-300 border-rose-800/50';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes} shadow-sm backdrop-blur-sm`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-85"></span>
      {status}
    </span>
  );
};
