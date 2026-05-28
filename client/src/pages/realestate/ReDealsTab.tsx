// ═══════════════════════════════════════
// DreamKey Properties — Deals Tab
// ═══════════════════════════════════════
import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit3, Trash2, Download, Calendar, ChevronRight } from 'lucide-react';
import { RE_DEAL_TYPES, RE_DEAL_STATUSES, RE_PROPERTY_TYPES, TN_DISTRICTS, re_id, type ReDeal, type ReDealType, type ReDealStatus, type RePropertyType } from './re-types';
import { ReModal, ReSearchInput, ReSelect, ReBadge, ReDealTypeBadge, ReEmptyState, ReFormField, ReModalTabs, ReConfirm, reInputClass } from './re-ui';
import { formatINR } from '../../utils/formatters';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';

interface Props {
  deals: ReDeal[];
  onSave: (d: ReDeal, isEdit: boolean) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ReDealStatus) => void;
  onActivity: (action: string, entity: string, id: string) => void;
}

const EMPTY_DEAL: ReDeal = {
  id: '', title: '', deal_type: 'Both Side Broker', status: 'New Lead', property_type: 'Residential Plot',
  district: '', area: '', property_value: 0, seller_name: '', seller_mobile: '', buyer_name: '',
  buyer_mobile: '', seller_broker_id: '', buyer_broker_id: '', commission_rate_seller: 0,
  commission_rate_buyer: 0, commission_amount: 0, commission_received: 0, token_amount: 0,
  follow_up_date: '', notes: '', documents: [], created_at: '',
};

const KANBAN_COLS: ReDealStatus[] = ['New Lead', 'Site Visit Done', 'Negotiation', 'Token Paid', 'Agreement Signed', 'Registration Done', 'Completed'];

export const ReDealsTab: React.FC<Props> = ({ deals, onSave, onDelete, onUpdateStatus, onActivity }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState(0);
  const [editing, setEditing] = useState<ReDeal | null>(null);
  const [form, setForm] = useState<ReDeal>(EMPTY_DEAL);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailDeal, setDetailDeal] = useState<ReDeal | null>(null);

  const filtered = useMemo(() => {
    let list = [...deals];
    const q = search.toLowerCase();
    if (q) list = list.filter(d => d.title.toLowerCase().includes(q) || d.seller_name.toLowerCase().includes(q) || d.buyer_name.toLowerCase().includes(q));
    if (filterStatus) list = list.filter(d => d.status === filterStatus);
    if (filterType) list = list.filter(d => d.deal_type === filterType);
    if (filterDistrict) list = list.filter(d => d.district === filterDistrict);
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [deals, search, filterStatus, filterType, filterDistrict]);

  const re_openAdd = useCallback(() => {
    setEditing(null); setForm({ ...EMPTY_DEAL, id: re_id(), created_at: new Date().toISOString() }); setModalTab(0); setModalOpen(true);
  }, []);

  const re_openEdit = useCallback((d: ReDeal) => {
    setEditing(d); setForm({ ...d }); setModalTab(0); setModalOpen(true);
  }, []);

  const re_handleSave = useCallback(() => {
    if (!form.title.trim()) return;
    // Auto-calculate commission
    const rate = form.commission_rate_seller + form.commission_rate_buyer;
    const commAmt = Math.round(form.property_value * rate / 100);
    const saved = { ...form, commission_amount: commAmt };
    onSave(saved, !!editing);
    onActivity(editing ? 'Updated deal' : 'Added deal', form.title, form.id);
    setModalOpen(false);
  }, [form, editing, onSave, onActivity]);

  const re_exportCSV = () => {
    const data = filtered.map(d => ({ Title: d.title, Type: d.deal_type, Status: d.status, 'Property Type': d.property_type, District: d.district, 'Property Value': d.property_value, 'Commission': d.commission_amount, 'Received': d.commission_received, Seller: d.seller_name, Buyer: d.buyer_name }));
    exportToCSV(data, 'dreamkey_deals');
  };

  const re_exportPDF = () => {
    const headers = ['Title', 'Type', 'Status', 'Value', 'Commission', 'Received'];
    const rows = filtered.map(d => [d.title, d.deal_type, d.status, formatINR(d.property_value), formatINR(d.commission_amount), formatINR(d.commission_received)]);
    exportToPDF('DreamKey — Deals', headers, rows, 'dreamkey_deals', [255, 107, 107]);
  };

  const updateForm = (partial: Partial<ReDeal>) => setForm(f => ({ ...f, ...partial }));

  return (
    <div className="space-y-5">
      {/* View mode toggle + filters */}
      <div id="re-deals-header" className="flex flex-wrap items-center gap-3">
        <div className="flex bg-brand-dark rounded-xl p-1">
          {(['table', 'kanban'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${viewMode === v ? 'bg-brand-re text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
              {v}
            </button>
          ))}
        </div>
        <ReSearchInput value={search} onChange={setSearch} placeholder="Search deals..." />
        <ReSelect id="re-deals-status" value={filterStatus} onChange={setFilterStatus} options={RE_DEAL_STATUSES} allLabel="All Status" />
        <ReSelect id="re-deals-type" value={filterType} onChange={setFilterType} options={RE_DEAL_TYPES} allLabel="All Types" />
        <ReSelect id="re-deals-district" value={filterDistrict} onChange={setFilterDistrict} options={TN_DISTRICTS} allLabel="All Districts" />
        <div className="flex gap-2 ml-auto">
          <button onClick={re_exportCSV} className="p-2 rounded-xl border border-brand-border text-gray-400 hover:text-white hover:border-brand-re/50 transition-colors" title="CSV"><Download size={16} /></button>
          <button onClick={re_exportPDF} className="p-2 rounded-xl border border-brand-border text-gray-400 hover:text-white hover:border-brand-re/50 transition-colors" title="PDF"><Download size={16} /></button>
          <button id="re-add-deal-btn" onClick={re_openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-re hover:bg-brand-re/90 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-re/20">
            <Plus size={16} /> Add Deal
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        filtered.length === 0 ? (
          <ReEmptyState icon="🤝" title="No deals yet" sub="Add your first deal to start tracking" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-brand-border">
            <table id="re-deals-table" className="w-full text-sm">
              <thead>
                <tr className="bg-brand-card/80">
                  {['Title', 'Type', 'Status', 'Property', 'District', 'Value', 'Commission', 'Received', 'Follow-up', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setDetailDeal(d)}>
                    <td className="px-4 py-3 font-semibold text-white whitespace-nowrap max-w-[200px] truncate">{d.title}</td>
                    <td className="px-4 py-3"><ReDealTypeBadge type={d.deal_type} /></td>
                    <td className="px-4 py-3"><ReBadge label={d.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{d.property_type}</td>
                    <td className="px-4 py-3 text-gray-400">{d.district}</td>
                    <td className="px-4 py-3 text-gray-300">{formatINR(d.property_value)}</td>
                    <td className="px-4 py-3 text-brand-re font-semibold">{formatINR(d.commission_amount)}</td>
                    <td className="px-4 py-3 text-emerald-400">{formatINR(d.commission_received)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {d.follow_up_date && (
                        <span className={`flex items-center gap-1 ${new Date(d.follow_up_date) <= new Date() ? 'text-orange-400' : ''}`}>
                          <Calendar size={12} /> {d.follow_up_date}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => re_openEdit(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><Edit3 size={14} /></button>
                        <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div id="re-deals-kanban" className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLS.map(col => {
            const colDeals = filtered.filter(d => d.status === col);
            return (
              <div key={col} className="min-w-[260px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <ReBadge label={col} />
                  <span className="text-xs text-gray-500">({colDeals.length})</span>
                </div>
                <div className="space-y-2">
                  {colDeals.map(d => (
                    <div key={d.id} onClick={() => setDetailDeal(d)} className="p-4 bg-brand-card border border-brand-border rounded-xl hover:border-brand-re/30 cursor-pointer transition-all">
                      <p className="text-sm font-semibold text-white mb-1 truncate">{d.title}</p>
                      <ReDealTypeBadge type={d.deal_type} />
                      <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>{d.district}</span>
                        <span className="text-brand-re font-semibold">{formatINR(d.property_value)}</span>
                      </div>
                      {d.follow_up_date && (
                        <div className={`flex items-center gap-1 mt-1.5 text-xs ${new Date(d.follow_up_date) <= new Date() ? 'text-orange-400' : 'text-gray-500'}`}>
                          <Calendar size={11} /> {d.follow_up_date}
                        </div>
                      )}
                    </div>
                  ))}
                  {colDeals.length === 0 && <div className="py-8 text-center text-gray-600 text-xs">Empty</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      <ReModal open={!!detailDeal} onClose={() => setDetailDeal(null)} title={detailDeal?.title || ''} width="max-w-lg">
        {detailDeal && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <ReDealTypeBadge type={detailDeal.deal_type} />
              <ReBadge label={detailDeal.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Property Type:</span> <span className="text-white ml-1">{detailDeal.property_type}</span></div>
              <div><span className="text-gray-500">District:</span> <span className="text-white ml-1">{detailDeal.district}, {detailDeal.area}</span></div>
              <div><span className="text-gray-500">Value:</span> <span className="text-brand-re font-semibold ml-1">{formatINR(detailDeal.property_value)}</span></div>
              <div><span className="text-gray-500">Commission:</span> <span className="text-white ml-1">{formatINR(detailDeal.commission_amount)}</span></div>
              <div><span className="text-gray-500">Received:</span> <span className="text-emerald-400 ml-1">{formatINR(detailDeal.commission_received)}</span></div>
              <div><span className="text-gray-500">Token:</span> <span className="text-white ml-1">{formatINR(detailDeal.token_amount)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm border-t border-brand-border pt-3">
              <div><span className="text-gray-500">Seller:</span> <span className="text-white ml-1">{detailDeal.seller_name}</span></div>
              <div><span className="text-gray-500">Buyer:</span> <span className="text-white ml-1">{detailDeal.buyer_name}</span></div>
            </div>
            {detailDeal.notes && <p className="text-sm text-gray-400 bg-brand-dark p-3 rounded-xl">{detailDeal.notes}</p>}

            {/* Quick status change */}
            <div className="border-t border-brand-border pt-4">
              <p className="text-xs text-gray-500 mb-2">Move to status:</p>
              <div className="flex flex-wrap gap-2">
                {RE_DEAL_STATUSES.filter(s => s !== detailDeal.status && s !== 'Dropped').map(s => (
                  <button key={s} onClick={() => { onUpdateStatus(detailDeal.id, s); onActivity('Status changed', `${detailDeal.title} → ${s}`, detailDeal.id); setDetailDeal({ ...detailDeal, status: s }); }}
                    className="px-3 py-1.5 rounded-lg text-xs border border-brand-border text-gray-400 hover:text-white hover:border-brand-re/50 transition-all flex items-center gap-1">
                    <ChevronRight size={12} /> {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { re_openEdit(detailDeal); setDetailDeal(null); }} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold border border-brand-re text-brand-re hover:bg-brand-re/10 transition-colors">Edit Deal</button>
              <button onClick={() => { setDeleteId(detailDeal.id); setDetailDeal(null); }} className="px-4 py-2 rounded-xl text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">Delete</button>
            </div>
          </div>
        )}
      </ReModal>

      {/* Add/Edit Modal */}
      <ReModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Deal' : 'Add Deal'} width="max-w-3xl">
        <ReModalTabs tabs={['Deal Info', 'Parties', 'Commission & Financials', 'Notes']} active={modalTab} onChange={setModalTab} />

        {modalTab === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReFormField label="Deal Title *" span={2}>
              <input className={reInputClass} value={form.title} onChange={e => updateForm({ title: e.target.value })} placeholder="e.g. Thirumangalam 3 Acre Plot" />
            </ReFormField>
            <ReFormField label="Deal Type">
              <select className={reInputClass} value={form.deal_type} onChange={e => updateForm({ deal_type: e.target.value as ReDealType })}>
                {RE_DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </ReFormField>
            <ReFormField label="Status">
              <select className={reInputClass} value={form.status} onChange={e => updateForm({ status: e.target.value as ReDealStatus })}>
                {RE_DEAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </ReFormField>
            <ReFormField label="Property Type">
              <select className={reInputClass} value={form.property_type} onChange={e => updateForm({ property_type: e.target.value as RePropertyType })}>
                {RE_PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </ReFormField>
            <ReFormField label="District">
              <select className={reInputClass} value={form.district} onChange={e => updateForm({ district: e.target.value })}>
                <option value="">Select</option>
                {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </ReFormField>
            <ReFormField label="Area / Town">
              <input className={reInputClass} value={form.area} onChange={e => updateForm({ area: e.target.value })} placeholder="Area" />
            </ReFormField>
            <ReFormField label="Follow-up Date">
              <input className={reInputClass} type="date" value={form.follow_up_date} onChange={e => updateForm({ follow_up_date: e.target.value })} />
            </ReFormField>
          </div>
        )}

        {modalTab === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReFormField label="Seller Name">
              <input className={reInputClass} value={form.seller_name} onChange={e => updateForm({ seller_name: e.target.value })} />
            </ReFormField>
            <ReFormField label="Seller Mobile">
              <input className={reInputClass} value={form.seller_mobile} onChange={e => updateForm({ seller_mobile: e.target.value })} />
            </ReFormField>
            <ReFormField label="Buyer Name">
              <input className={reInputClass} value={form.buyer_name} onChange={e => updateForm({ buyer_name: e.target.value })} />
            </ReFormField>
            <ReFormField label="Buyer Mobile">
              <input className={reInputClass} value={form.buyer_mobile} onChange={e => updateForm({ buyer_mobile: e.target.value })} />
            </ReFormField>
          </div>
        )}

        {modalTab === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReFormField label="Property Value (₹)">
              <input className={reInputClass} type="number" value={form.property_value} onChange={e => updateForm({ property_value: +e.target.value })} />
            </ReFormField>
            <ReFormField label="Token Amount (₹)">
              <input className={reInputClass} type="number" value={form.token_amount} onChange={e => updateForm({ token_amount: +e.target.value })} />
            </ReFormField>
            <ReFormField label="Seller Side Rate %">
              <input className={reInputClass} type="number" step="0.1" value={form.commission_rate_seller} onChange={e => updateForm({ commission_rate_seller: +e.target.value })} />
            </ReFormField>
            <ReFormField label="Buyer Side Rate %">
              <input className={reInputClass} type="number" step="0.1" value={form.commission_rate_buyer} onChange={e => updateForm({ commission_rate_buyer: +e.target.value })} />
            </ReFormField>
            <ReFormField label="Commission Received (₹)">
              <input className={reInputClass} type="number" value={form.commission_received} onChange={e => updateForm({ commission_received: +e.target.value })} />
            </ReFormField>
            <div className="flex items-end">
              <div className="p-3 bg-brand-re/10 rounded-xl border border-brand-re/20 text-sm">
                <span className="text-gray-400">Estimated Commission:</span>
                <span className="text-brand-re font-bold ml-2">
                  {formatINR(Math.round(form.property_value * (form.commission_rate_seller + form.commission_rate_buyer) / 100))}
                </span>
              </div>
            </div>
          </div>
        )}

        {modalTab === 3 && (
          <ReFormField label="Notes" span={2}>
            <textarea className={`${reInputClass} min-h-[140px]`} value={form.notes} onChange={e => updateForm({ notes: e.target.value })} placeholder="Deal notes..." />
          </ReFormField>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white border border-brand-border hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={re_handleSave} className="px-6 py-2 rounded-xl text-sm font-semibold bg-brand-re hover:bg-brand-re/90 text-white transition-all shadow-lg shadow-brand-re/20">
            {editing ? 'Update' : 'Add Deal'}
          </button>
        </div>
      </ReModal>

      <ReConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) { onDelete(deleteId); onActivity('Deleted deal', '', deleteId); } }} title="Delete Deal" message="Are you sure? This action cannot be undone." />
    </div>
  );
};
