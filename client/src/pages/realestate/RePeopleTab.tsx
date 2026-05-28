// ═══════════════════════════════════════
// AadanaTharakar — People & Network
// ═══════════════════════════════════════
import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit3, Trash2, Pin, Phone, MessageCircle, ChevronDown, Download } from 'lucide-react';
import { RE_PERSON_TYPES, TN_DISTRICTS, re_id, type RePerson, type RePersonType, type ReProperty, RE_PROPERTY_TYPES } from './re-types';
import { ReModal, ReSearchInput, ReSelect, ReBadge, ReEmptyState, ReFormField, ReModalTabs, ReConfirm, reInputClass } from './re-ui';
import { formatINR } from '../../utils/formatters';
import { getWhatsAppLink } from '../../utils/formatters';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';

interface Props {
  people: RePerson[];
  properties?: ReProperty[];
  onSave: (p: RePerson, isEdit: boolean) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onActivity: (action: string, entity: string, id: string) => void;
}

const EMPTY_PERSON: RePerson = {
  id: '', name: '', person_type: 'Broker', mobile: '', email: '', district: '', area: '',
  company: '', rera_id: '', commission_giver: false, commission_rate: 0, total_commission: 0,
  status: 'Active', pinned: false, notes: '', specialization: '', created_at: '',
};

export const RePeopleTab: React.FC<Props> = ({ people, properties = [], onSave, onDelete, onTogglePin, onActivity }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCommGiver, setFilterCommGiver] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState(0);
  const [editing, setEditing] = useState<RePerson | null>(null);
  const [form, setForm] = useState<RePerson>(EMPTY_PERSON);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [matchesModal, setMatchesModal] = useState<RePerson | null>(null);
  const [typePill, setTypePill] = useState('All');

  const pillTypes = ['All', ...RE_PERSON_TYPES];

  const filtered = useMemo(() => {
    let list = [...people];
    const q = search.toLowerCase();
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || p.mobile.includes(q) || p.district.toLowerCase().includes(q));
    const effectiveType = typePill !== 'All' ? typePill : filterType;
    if (effectiveType) list = list.filter(p => p.person_type === effectiveType);
    if (filterDistrict) list = list.filter(p => p.district === filterDistrict);
    if (filterStatus) list = list.filter(p => p.status === filterStatus);
    if (filterCommGiver === 'Yes') list = list.filter(p => p.commission_giver);
    if (filterCommGiver === 'No') list = list.filter(p => !p.commission_giver);

    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'commission') return b.total_commission - a.total_commission;
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });
    return list;
  }, [people, search, filterType, filterDistrict, filterStatus, filterCommGiver, sortBy, typePill]);

  const re_openAdd = useCallback(() => {
    setEditing(null);
    setForm({ ...EMPTY_PERSON, id: re_id(), created_at: new Date().toISOString() });
    setModalTab(0);
    setModalOpen(true);
  }, []);

  const re_openEdit = useCallback((p: RePerson) => {
    setEditing(p);
    setForm({ ...p });
    setModalTab(0);
    setModalOpen(true);
  }, []);

  const re_handleSave = useCallback(() => {
    if (!form.name.trim()) return;
    onSave(form, !!editing);
    onActivity(editing ? 'Updated person' : 'Added person', form.name, form.id);
    setModalOpen(false);
  }, [form, editing, onSave, onActivity]);

  const re_exportCSV = () => {
    const data = filtered.map(p => ({ Name: p.name, Type: p.person_type, Mobile: p.mobile, District: p.district, 'Commission Giver': p.commission_giver ? 'Yes' : 'No', 'Rate %': p.commission_rate, 'Total Commission': p.total_commission, Status: p.status }));
    exportToCSV(data, 'aadanatharakar_people');
  };

  const re_exportPDF = () => {
    const headers = ['Name', 'Type', 'Mobile', 'District', 'Comm Giver', 'Rate %', 'Total Comm', 'Status'];
    const rows = filtered.map(p => [p.name, p.person_type, p.mobile, p.district, p.commission_giver ? 'Yes' : 'No', String(p.commission_rate), formatINR(p.total_commission), p.status]);
    exportToPDF('AadanaTharakar — People & Network', headers, rows, 'aadanatharakar_people', [255, 107, 107]);
  };

  const updateForm = (partial: Partial<RePerson>) => setForm(f => ({ ...f, ...partial }));

  return (
    <div className="space-y-5">
      {/* Type pills */}
      <div id="re-people-type-pills" className="flex flex-wrap gap-2">
        {pillTypes.map(t => (
          <button key={t} onClick={() => setTypePill(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${typePill === t ? 'bg-brand-re text-white shadow-lg shadow-brand-re/30' : 'bg-brand-card border border-brand-border text-gray-400 hover:text-white hover:border-brand-re/50'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div id="re-people-filters" className="flex flex-wrap items-center gap-3">
        <ReSearchInput value={search} onChange={setSearch} placeholder="Search people..." />
        <ReSelect id="re-people-district" value={filterDistrict} onChange={setFilterDistrict} options={TN_DISTRICTS} allLabel="All Districts" />
        <ReSelect id="re-people-status" value={filterStatus} onChange={setFilterStatus} options={['Active', 'Inactive']} allLabel="All Status" />
        <ReSelect id="re-people-comm" value={filterCommGiver} onChange={setFilterCommGiver} options={['Yes', 'No']} allLabel="Comm Giver" />
        <ReSelect id="re-people-sort" value={sortBy} onChange={setSortBy} options={['name', 'commission', 'newest']} allLabel="Sort by" />
        <div className="flex gap-2 ml-auto">
          <button onClick={re_exportCSV} className="p-2 rounded-xl border border-brand-border text-gray-400 hover:text-white hover:border-brand-re/50 transition-colors" title="Export CSV"><Download size={16} /></button>
          <button onClick={re_exportPDF} className="p-2 rounded-xl border border-brand-border text-gray-400 hover:text-white hover:border-brand-re/50 transition-colors" title="Export PDF"><Download size={16} /></button>
          <button id="re-add-person-btn" onClick={re_openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-re hover:bg-brand-re/90 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-re/20">
            <Plus size={16} /> Add Person
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <ReEmptyState icon="👥" title="No people found" sub="Add your first contact to get started" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-border">
          <table id="re-people-table" className="w-full text-sm">
            <thead>
              <tr className="bg-brand-card/80">
                {['', 'Name', 'Type', 'Mobile', 'District', 'Comm Giver', 'Rate %', 'Total Comm', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => onTogglePin(p.id)} className={`${p.pinned ? 'text-brand-re' : 'text-gray-600 hover:text-gray-400'} transition-colors`}><Pin size={14} /></button>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{p.name}</td>
                  <td className="px-4 py-3"><ReBadge label={p.person_type} /></td>
                  <td className="px-4 py-3 text-gray-300">{p.mobile}</td>
                  <td className="px-4 py-3 text-gray-400">{p.district}</td>
                  <td className="px-4 py-3">{p.commission_giver ? <span className="text-emerald-400 font-semibold">Yes</span> : <span className="text-gray-500">No</span>}</td>
                  <td className="px-4 py-3 text-gray-300">{p.commission_rate}%</td>
                  <td className="px-4 py-3 text-brand-re font-semibold">{formatINR(p.total_commission)}</td>
                  <td className="px-4 py-3"><ReBadge label={p.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setMatchesModal(p)} className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors" title="Find Property Matches"><Pin size={14} /></button>
                      <a href={getWhatsAppLink(p.mobile)} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"><MessageCircle size={14} /></a>
                      <a href={`tel:${p.mobile}`} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"><Phone size={14} /></a>
                      <button onClick={() => re_openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><Edit3 size={14} /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <ReModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Person' : 'Add Person'} width="max-w-2xl">
        <ReModalTabs tabs={['Basic Info', 'Professional', 'Commission & Notes']} active={modalTab} onChange={setModalTab} />

        
        {modalTab === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReFormField label="Full Name *">
              <input className={reInputClass} value={form.name} onChange={e => updateForm({ name: e.target.value })} placeholder="Enter full name" />
            </ReFormField>
            <ReFormField label="Person Type">
              <select className={reInputClass} value={form.person_type} onChange={e => updateForm({ person_type: e.target.value as RePersonType })}>
                {RE_PERSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </ReFormField>
            <ReFormField label="Mobile">
              <input className={reInputClass} value={form.mobile} onChange={e => updateForm({ mobile: e.target.value })} placeholder="98765 43210" />
            </ReFormField>
            <ReFormField label="Email">
              <input className={reInputClass} value={form.email} onChange={e => updateForm({ email: e.target.value })} placeholder="email@example.com" />
            </ReFormField>
            <ReFormField label="District">
              <select className={reInputClass} value={form.district} onChange={e => updateForm({ district: e.target.value })}>
                <option value="">Select District</option>
                {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </ReFormField>
            <ReFormField label="Area / Town">
              <input className={reInputClass} value={form.area} onChange={e => updateForm({ area: e.target.value })} placeholder="Area / Town" />
            </ReFormField>
            {form.person_type === 'Buyer' && (
              <>
                <ReFormField label="Buyer Budget (₹)">
                  <input className={reInputClass} type="number" value={form.buyer_budget || ''} onChange={e => updateForm({ buyer_budget: +e.target.value })} placeholder="e.g. 5000000" />
                </ReFormField>
                <ReFormField label="Requirement Type">
                  <select className={reInputClass} value={form.buyer_property_type || 'Any'} onChange={e => updateForm({ buyer_property_type: e.target.value as any })}>
                    <option value="Any">Any</option>
                    {RE_PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </ReFormField>
              </>
            )}
            <ReFormField label="Status">
              <select className={reInputClass} value={form.status} onChange={e => updateForm({ status: e.target.value as 'Active' | 'Inactive' })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </ReFormField>
          </div>
        )}

        {modalTab === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReFormField label="Company / Firm">
              <input className={reInputClass} value={form.company} onChange={e => updateForm({ company: e.target.value })} placeholder="Company name" />
            </ReFormField>
            <ReFormField label="RERA ID">
              <input className={reInputClass} value={form.rera_id} onChange={e => updateForm({ rera_id: e.target.value })} placeholder="TN-RE-XXXX" />
            </ReFormField>
            <ReFormField label="Specialization" span={2}>
              <input className={reInputClass} value={form.specialization} onChange={e => updateForm({ specialization: e.target.value })} placeholder="e.g. Agricultural Land, Modular Kitchen" />
            </ReFormField>
          </div>
        )}

        {modalTab === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ReFormField label="Commission Giver">
                <select className={reInputClass} value={form.commission_giver ? 'Yes' : 'No'} onChange={e => updateForm({ commission_giver: e.target.value === 'Yes' })}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </ReFormField>
              <ReFormField label="Commission Rate %">
                <input className={reInputClass} type="number" step="0.1" value={form.commission_rate} onChange={e => updateForm({ commission_rate: +e.target.value })} />
              </ReFormField>
              <ReFormField label="Total Commission (₹)">
                <input className={reInputClass} type="number" value={form.total_commission} onChange={e => updateForm({ total_commission: +e.target.value })} />
              </ReFormField>
            </div>
            <ReFormField label="Notes" span={2}>
              <textarea className={`${reInputClass} min-h-[100px]`} value={form.notes} onChange={e => updateForm({ notes: e.target.value })} placeholder="Any notes..." />
            </ReFormField>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white border border-brand-border hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={re_handleSave} className="px-6 py-2 rounded-xl text-sm font-semibold bg-brand-re hover:bg-brand-re/90 text-white transition-all shadow-lg shadow-brand-re/20">
            {editing ? 'Update' : 'Add Person'}
          </button>
        </div>
      </ReModal>

      
      {/* Matches Modal */}
      <ReModal open={!!matchesModal} onClose={() => setMatchesModal(null)} title={`Property Matches for ${matchesModal?.name}`} width="max-w-4xl">
        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-brand-border/60 p-4 rounded-xl text-sm text-slate-300">
            <p><strong>Requirement:</strong> {matchesModal?.buyer_property_type || 'Any Type'} in <strong>{matchesModal?.district || 'Any Location'}</strong></p>
            <p><strong>Budget:</strong> {matchesModal?.buyer_budget ? formatINR(matchesModal.buyer_budget) : 'Not Specified'}</p>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-brand-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-card/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Match Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {(() => {
                  if (!matchesModal) return null;
                  const matches = properties.map(prop => {
                    let score = 0;
                    if (prop.district === matchesModal.district) score += 40;
                    if (prop.area.toLowerCase().includes(matchesModal.area.toLowerCase()) && matchesModal.area) score += 20;
                    if (matchesModal.buyer_property_type && matchesModal.buyer_property_type !== 'Any' && prop.property_type === matchesModal.buyer_property_type) score += 30;
                    
                    if (matchesModal.buyer_budget && prop.price) {
                      const diff = Math.abs(prop.price - matchesModal.buyer_budget) / matchesModal.buyer_budget;
                      if (diff <= 0.1) score += 30; // Within 10%
                      else if (diff <= 0.25) score += 15; // Within 25%
                    }
                    
                    return { prop, score };
                  })
                  .filter(m => m.score > 0)
                  .sort((a, b) => b.score - a.score);

                  if (matches.length === 0) {
                    return <tr><td colSpan={5} className="p-8 text-center text-slate-500">No properties match this buyer's criteria.</td></tr>;
                  }

                  return matches.map(m => (
                    <tr key={m.prop.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">{m.prop.title}</td>
                      <td className="px-4 py-3"><ReBadge label={m.prop.property_type} /></td>
                      <td className="px-4 py-3 text-slate-400">{m.prop.area}, {m.prop.district}</td>
                      <td className="px-4 py-3 text-brand-re font-bold">{formatINR(m.prop.price)}</td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-slate-800 rounded-full h-2 mt-1">
                          <div className={`h-2 rounded-full ${m.score >= 70 ? 'bg-emerald-500' : m.score >= 40 ? 'bg-amber-500' : 'bg-slate-500'}`} style={{ width: `${Math.min(100, m.score)}%` }}></div>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{Math.min(100, m.score)}% Match</span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </ReModal>

      {/* Delete confirm */}
      <ReConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) { onDelete(deleteId); onActivity('Deleted person', '', deleteId); } }} title="Delete Person" message="Are you sure? This action cannot be undone." />
    </div>
  );
};
