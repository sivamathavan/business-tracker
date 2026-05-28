// ═══════════════════════════════════════
// AadanaTharakar — Shared UI Pieces
// ═══════════════════════════════════════
import React from 'react';
import { X, Search } from 'lucide-react';

// ── Modal Shell ─────────────────────────

export const ReModal: React.FC<{
  open: boolean; onClose: () => void; title: string; width?: string; children: React.ReactNode;
}> = ({ open, onClose, title, width = 'max-w-2xl', children }) => {
  if (!open) return null;
  return (
    <div id="re-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if ((e.target as HTMLElement).id === 're-modal-backdrop') onClose(); }}>
      <div className={`${width} w-full bg-brand-card border border-brand-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95`}>
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <h3 className="font-heading text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// ── Status Badge ────────────────────────

const STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-emerald-500/20 text-emerald-400',
  'Inactive': 'bg-gray-500/20 text-gray-400',
  'New Lead': 'bg-blue-500/20 text-blue-400',
  'Site Visit Done': 'bg-cyan-500/20 text-cyan-400',
  'Negotiation': 'bg-yellow-500/20 text-yellow-400',
  'Token Paid': 'bg-orange-500/20 text-orange-400',
  'Agreement Signed': 'bg-purple-500/20 text-purple-400',
  'Registration Done': 'bg-pink-500/20 text-pink-400',
  'Completed': 'bg-emerald-500/20 text-emerald-400',
  'Dropped': 'bg-red-500/20 text-red-400',
  'Available': 'bg-emerald-500/20 text-emerald-400',
  'Under Deal': 'bg-yellow-500/20 text-yellow-400',
  'Sold': 'bg-blue-500/20 text-blue-400',
  'Off Market': 'bg-gray-500/20 text-gray-400',
  'Pending': 'bg-yellow-500/20 text-yellow-400',
  'Partial': 'bg-orange-500/20 text-orange-400',
  'Received': 'bg-emerald-500/20 text-emerald-400',
  'Verified': 'bg-blue-500/20 text-blue-400',
};

export const ReBadge: React.FC<{ label: string; className?: string }> = ({ label, className = '' }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[label] || 'bg-gray-500/20 text-gray-400'} ${className}`}>
    {label}
  </span>
);

// ── Deal Type Badge ─────────────────────

const DEAL_TYPE_COLORS: Record<string, string> = {
  'Both Side Broker': 'bg-brand-re/20 text-brand-re',
  'Buyer Side Only': 'bg-blue-500/20 text-blue-400',
  'Seller Side Only': 'bg-purple-500/20 text-purple-400',
  'Direct Deal': 'bg-emerald-500/20 text-emerald-400',
  'Chain Broker': 'bg-orange-500/20 text-orange-400',
  'Referral': 'bg-cyan-500/20 text-cyan-400',
};

export const ReDealTypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${DEAL_TYPE_COLORS[type] || 'bg-gray-500/20 text-gray-400'}`}>
    {type}
  </span>
);

// ── Search Input ────────────────────────

export const ReSearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
    <input id="re-search-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="pl-9 pr-4 py-2 bg-brand-dark border border-brand-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-re/50 w-full sm:w-64 transition-all" />
  </div>
);

// ── Select ──────────────────────────────

export const ReSelect: React.FC<{
  id?: string; value: string; onChange: (v: string) => void; options: readonly string[]; allLabel?: string; className?: string;
}> = ({ id, value, onChange, options, allLabel = 'All', className = '' }) => (
  <select id={id} value={value} onChange={e => onChange(e.target.value)}
    className={`px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-re/50 ${className}`}>
    <option value="">{allLabel}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

// ── Stat Card ───────────────────────────

export const ReStatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: boolean;
}> = ({ icon, label, value, sub, accent }) => (
  <div className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${accent ? 'bg-brand-re/10 border-brand-re/30' : 'bg-brand-card border-brand-border'}`}>
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
    <div className={`text-2xl font-heading font-bold ${accent ? 'text-brand-re' : 'text-white'}`}>{value}</div>
    {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
  </div>
);

// ── Empty State ─────────────────────────

export const ReEmptyState: React.FC<{ icon: string; title: string; sub: string }> = ({ icon, title, sub }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <span className="text-5xl mb-4">{icon}</span>
    <h4 className="text-lg font-heading font-bold text-gray-300 mb-1">{title}</h4>
    <p className="text-sm text-gray-500">{sub}</p>
  </div>
);

// ── Form helpers ────────────────────────

export const ReFormField: React.FC<{
  label: string; children: React.ReactNode; span?: number;
}> = ({ label, children, span = 1 }) => (
  <div className={span === 2 ? 'sm:col-span-2' : ''}>
    <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
    {children}
  </div>
);

export const reInputClass = "w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-re/50 transition-all";

// ── Doc Score Bar ───────────────────────

export const ReDocScoreBar: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-brand-dark rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-400">{score}%</span>
    </div>
  );
};

// ── Confirm Dialog ──────────────────────

export const ReConfirm: React.FC<{
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string;
}> = ({ open, onClose, onConfirm, title, message }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="max-w-sm w-full bg-brand-card border border-brand-border rounded-2xl p-6 shadow-2xl">
        <h4 className="font-heading font-bold text-white mb-2">{title}</h4>
        <p className="text-sm text-gray-400 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white border border-brand-border hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
};

// ── Modal Tabs ──────────────────────────

export const ReModalTabs: React.FC<{
  tabs: string[]; active: number; onChange: (i: number) => void;
}> = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 bg-brand-dark rounded-xl p-1 mb-5">
    {tabs.map((t, i) => (
      <button key={t} onClick={() => onChange(i)}
        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${i === active ? 'bg-brand-re text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
        {t}
      </button>
    ))}
  </div>
);
