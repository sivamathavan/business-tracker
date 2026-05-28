// ═══════════════════════════════════════
// AadanaTharakar — Properties Tab
// ═══════════════════════════════════════
import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit3, Trash2, Download, MapPin, ExternalLink } from 'lucide-react';
import { RE_PROPERTY_TYPES, RE_PROPERTY_STATUSES, RE_SUBMITTER_TYPES, RE_DOC_ITEMS, TN_DISTRICTS, re_id, type ReProperty, type RePropertyType, type RePropertyStatus } from './re-types';
import { ReModal, ReSearchInput, ReSelect, ReBadge, ReEmptyState, ReFormField, ReModalTabs, ReConfirm, ReDocScoreBar, reInputClass } from './re-ui';
import { re_calcDocScore } from './re-hooks';
import { formatINR } from '../../utils/formatters';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';

interface Props {
  properties: ReProperty[];
  onSave: (p: ReProperty, isEdit: boolean) => void;
  onDelete: (id: string) => void;
  onActivity: (action: string, entity: string, id: string) => void;
}

function re_makeDocChecklist(): Record<string, 'Pending' | 'Received' | 'Verified'> {
  const obj: Record<string, 'Pending' | 'Received' | 'Verified'> = {};
  RE_DOC_ITEMS.forEach(d => { obj[d] = 'Pending'; });
  return obj;
}

const EMPTY_PROP: ReProperty = {
  id: '', title: '', property_type: 'Residential Plot', status: 'Available', district: '', area: '',
  extent: '', road_facing: '', price: 0, price_per_unit: '', submitter_type: 'Broker', submitter_name: '',
  submitter_mobile: '', owner_name: '', owner_mobile: '', survey_number: '', maps_link: '',
  doc_checklist: re_makeDocChecklist(), photos: [], notes: '', created_at: '',
};

export const RePropertiesTab: React.FC<Props> = ({ properties, onSave, onDelete, onActivity }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState(0);
  const [editing, setEditing] = useState<ReProperty | null>(null);
  const [form, setForm] = useState<ReProperty>(EMPTY_PROP);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailProp, setDetailProp] = useState<ReProperty | null>(null);

  const filtered = useMemo(() => {
    let list = [...properties];
    const q = search.toLowerCase();
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.survey_number.toLowerCase().includes(q));
    if (filterType) list = list.filter(p => p.property_type === filterType);
    if (filterStatus) list = list.filter(p => p.status === filterStatus);
    if (filterDistrict) list = list.filter(p => p.district === filterDistrict);
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [properties, search, filterType, filterStatus, filterDistrict]);

  const re_openAdd = useCallback(() => {
    setEditing(null); setForm({ ...EMPTY_PROP, id: re_id(), doc_checklist: re_makeDocChecklist(), created_at: new Date().toISOString() }); setModalTab(0); setModalOpen(true);
  }, []);

  const re_openEdit = useCallback((p: ReProperty) => {
    setEditing(p); setForm({ ...p, doc_checklist: { ...p.doc_checklist } }); setModalTab(0); setModalOpen(true);
  }, []);

  const re_handleSave = useCallback(() => {
    if (!form.title.trim()) return;
    onSave(form, !!editing);
    onActivity(editing ? 'Updated property' : 'Added property', form.title, form.id);
    setModalOpen(false);
  }, [form, editing, onSave, onActivity]);

  const updateForm = (partial: Partial<ReProperty>) => setForm(f => ({ ...f, ...partial }));

  const re_updateDocStatus = (doc: string, status: 'Pending' | 'Received' | 'Verified') => {
    setForm(f => ({ ...f, doc_checklist: { ...f.doc_checklist, [doc]: status } }));
  };

  const re_exportCSV = () => {
    const data = filtered.map(p => ({ Title: p.title, Type: p.property_type, Status: p.status, District: p.district, Area: p.area, Extent: p.extent, Price: p.price, 'Survey No': p.survey_number, Owner: p.owner_name, 'Doc Score': `${re_calcDocScore(p.doc_checklist)}%` }));
    exportToCSV(data, 'aadanatharakar_properties');
  };

  const re_exportPDF = () => {
    const headers = ['Title', 'Type', 'Status', 'District', 'Extent', 'Price', 'Survey No', 'Doc %'];
    const rows = filtered.map(p => [p.title, p.property_type, p.status, p.district, p.extent, formatINR(p.price), p.survey_number, `${re_calcDocScore(p.doc_checklist)}%`]);
    exportToPDF('AadanaTharakar — Properties', headers, rows, 'aadanatharakar_properties', [255, 107, 107]);
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div id="re-props-header" className="flex flex-wrap items-center gap-3">
        <div className="flex bg-brand-dark rounded-xl p-1">
          {(['grid', 'table'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${viewMode === v ? 'bg-brand-re text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
              {v}
            </button>
          ))}
        </div>
        <ReSearchInput value={search} onChange={setSearch} placeholder="Search properties..." />
        <ReSelect id="re-props-type" value={filterType} onChange={setFilterType} options={RE_PROPERTY_TYPES} allLabel="All Types" />
        <ReSelect id="re-props-status" value={filterStatus} onChange={setFilterStatus} options={RE_PROPERTY_STATUSES} allLabel="All Status" />
        <ReSelect id="re-props-district" value={filterDistrict} onChange={setFilterDistrict} options={TN_DISTRICTS} allLabel="All Districts" />
        <div className="flex gap-2 ml-auto">
          <button onClick={re_exportCSV} className="p-2 rounded-xl border border-brand-border text-gray-400 hover:text-white hover:border-brand-re/50 transition-colors"><Download size={16} /></button>
          <button onClick={re_exportPDF} className="p-2 rounded-xl border border-brand-border text-gray-400 hover:text-white hover:border-brand-re/50 transition-colors"><Download size={16} /></button>
          <button id="re-add-property-btn" onClick={re_openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-re hover:bg-brand-re/90 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-re/20">
            <Plus size={16} /> Add Property
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <ReEmptyState icon="🏘" title="No properties found" sub="Add your first property listing" />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} onClick={() => setDetailProp(p)} className="bg-brand-card border border-brand-border rounded-2xl p-5 hover:border-brand-re/30 cursor-pointer transition-all group">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-heading font-bold text-white text-sm truncate flex-1">{p.title}</h4>
                <ReBadge label={p.status} />
              </div>
              <div className="space-y-1.5 text-xs text-gray-400">
                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-brand-re" /> {p.district}, {p.area}</div>
                <div>Type: <span className="text-gray-300">{p.property_type}</span></div>
                <div>Extent: <span className="text-gray-300">{p.extent}</span> • Road: <span className="text-gray-300">{p.road_facing || '-'}</span></div>
                <div>Survey: <span className="text-gray-300">{p.survey_number || '-'}</span></div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-border/50">
                <span className="text-brand-re font-heading font-bold">{formatINR(p.price)}</span>
                <ReDocScoreBar score={re_calcDocScore(p.doc_checklist)} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-border">
          <table id="re-props-table" className="w-full text-sm">
            <thead>
              <tr className="bg-brand-card/80">
                {['Title', 'Type', 'Status', 'District', 'Extent', 'Price', 'Survey', 'Docs', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setDetailProp(p)}>
                  <td className="px-4 py-3 font-semibold text-white max-w-[200px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.property_type}</td>
                  <td className="px-4 py-3"><ReBadge label={p.status} /></td>
                  <td className="px-4 py-3 text-gray-400">{p.district}</td>
                  <td className="px-4 py-3 text-gray-300">{p.extent}</td>
                  <td className="px-4 py-3 text-brand-re font-semibold">{formatINR(p.price)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.survey_number || '-'}</td>
                  <td className="px-4 py-3"><ReDocScoreBar score={re_calcDocScore(p.doc_checklist)} /></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1.5">
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

      {/* Detail Modal */}
      <ReModal open={!!detailProp} onClose={() => setDetailProp(null)} title={detailProp?.title || ''} width="max-w-lg">
        {detailProp && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <ReBadge label={detailProp.status} />
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-card border border-brand-border text-gray-300">{detailProp.property_type}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">District:</span> <span className="text-white ml-1">{detailProp.district}, {detailProp.area}</span></div>
              <div><span className="text-gray-500">Extent:</span> <span className="text-white ml-1">{detailProp.extent}</span></div>
              <div><span className="text-gray-500">Road Facing:</span> <span className="text-white ml-1">{detailProp.road_facing || '-'}</span></div>
              <div><span className="text-gray-500">Survey No:</span> <span className="text-white ml-1">{detailProp.survey_number || '-'}</span></div>
              <div><span className="text-gray-500">Price:</span> <span className="text-brand-re font-bold ml-1">{formatINR(detailProp.price)}</span></div>
              <div><span className="text-gray-500">Per Unit:</span> <span className="text-white ml-1">{detailProp.price_per_unit || '-'}</span></div>
              <div><span className="text-gray-500">Owner:</span> <span className="text-white ml-1">{detailProp.owner_name}</span></div>
              <div><span className="text-gray-500">Submitter:</span> <span className="text-white ml-1">{detailProp.submitter_name} ({detailProp.submitter_type})</span></div>
            </div>
            {detailProp.maps_link && (
              <a href={detailProp.maps_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-400 hover:underline">
                <ExternalLink size={14} /> Open in Maps
              </a>
            )}
            {/* Doc Checklist display */}
            <div className="border-t border-brand-border pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-semibold">Document Checklist</p>
                <ReDocScoreBar score={re_calcDocScore(detailProp.doc_checklist)} />
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {Object.entries(detailProp.doc_checklist).map(([doc, st]) => (
                  <div key={doc} className="flex items-center justify-between py-1 text-xs">
                    <span className="text-gray-400">{doc}</span>
                    <ReBadge label={st} />
                  </div>
                ))}
              </div>
            </div>
            {detailProp.notes && <p className="text-sm text-gray-400 bg-brand-dark p-3 rounded-xl">{detailProp.notes}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { re_openEdit(detailProp); setDetailProp(null); }} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold border border-brand-re text-brand-re hover:bg-brand-re/10 transition-colors">Edit</button>
              <button onClick={() => { setDeleteId(detailProp.id); setDetailProp(null); }} className="px-4 py-2 rounded-xl text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">Delete</button>
            </div>
          </div>
        )}
      </ReModal>

      {/* Add/Edit Modal */}
      <ReModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Property' : 'Add Property'} width="max-w-3xl">
        <ReModalTabs tabs={['Basic', 'Location & Details', 'Owner & Source', 'Documents', 'Notes']} active={modalTab} onChange={setModalTab} />

        {modalTab === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReFormField label="Title *" span={2}>
              <input className={reInputClass} value={form.title} onChange={e => updateForm({ title: e.target.value })} placeholder="e.g. 3 Acres NH Facing Land" />
            </ReFormField>
            <ReFormField label="Property Type">
              <select className={reInputClass} value={form.property_type} onChange={e => updateForm({ property_type: e.target.value as RePropertyType })}>
                {RE_PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </ReFormField>
            <ReFormField label="Status">
              <select className={reInputClass} value={form.status} onChange={e => updateForm({ status: e.target.value as RePropertyStatus })}>
                {RE_PROPERTY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </ReFormField>
            <ReFormField label="Price (₹)">
              <input className={reInputClass} type="number" value={form.price} onChange={e => updateForm({ price: +e.target.value })} />
            </ReFormField>
            <ReFormField label="Price per Unit">
              <input className={reInputClass} value={form.price_per_unit} onChange={e => updateForm({ price_per_unit: e.target.value })} placeholder="e.g. ₹15L/acre" />
            </ReFormField>
          </div>
        )}

        {modalTab === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReFormField label="District">
              <select className={reInputClass} value={form.district} onChange={e => updateForm({ district: e.target.value })}>
                <option value="">Select</option>
                {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </ReFormField>
            <ReFormField label="Area / Town">
              <input className={reInputClass} value={form.area} onChange={e => updateForm({ area: e.target.value })} />
            </ReFormField>
            <ReFormField label="Extent">
              <input className={reInputClass} value={form.extent} onChange={e => updateForm({ extent: e.target.value })} placeholder="e.g. 3 Acres, 2400 sqft" />
            </ReFormField>
            <ReFormField label="Road Facing">
              <input className={reInputClass} value={form.road_facing} onChange={e => updateForm({ road_facing: e.target.value })} placeholder="e.g. 60 ft NH" />
            </ReFormField>
            <ReFormField label="Survey Number">
              <input className={reInputClass} value={form.survey_number} onChange={e => updateForm({ survey_number: e.target.value })} />
            </ReFormField>
            <ReFormField label="Google Maps Link">
              <input className={reInputClass} value={form.maps_link} onChange={e => updateForm({ maps_link: e.target.value })} placeholder="https://maps.google.com/..." />
            </ReFormField>
          </div>
        )}

        {modalTab === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReFormField label="Submitter Type">
              <select className={reInputClass} value={form.submitter_type} onChange={e => updateForm({ submitter_type: e.target.value })}>
                {RE_SUBMITTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </ReFormField>
            <ReFormField label="Submitter Name">
              <input className={reInputClass} value={form.submitter_name} onChange={e => updateForm({ submitter_name: e.target.value })} />
            </ReFormField>
            <ReFormField label="Submitter Mobile">
              <input className={reInputClass} value={form.submitter_mobile} onChange={e => updateForm({ submitter_mobile: e.target.value })} />
            </ReFormField>
            <div />
            <ReFormField label="Owner Name">
              <input className={reInputClass} value={form.owner_name} onChange={e => updateForm({ owner_name: e.target.value })} />
            </ReFormField>
            <ReFormField label="Owner Mobile">
              <input className={reInputClass} value={form.owner_mobile} onChange={e => updateForm({ owner_mobile: e.target.value })} />
            </ReFormField>
          </div>
        )}

        {modalTab === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-2">Update the status of each required document:</p>
            {RE_DOC_ITEMS.map(doc => (
              <div key={doc} className="flex items-center justify-between py-2 border-b border-brand-border/30 last:border-0">
                <span className="text-sm text-gray-300">{doc}</span>
                <div className="flex gap-1">
                  {(['Pending', 'Received', 'Verified'] as const).map(st => (
                    <button key={st} onClick={() => re_updateDocStatus(doc, st)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${form.doc_checklist[doc] === st ? (st === 'Verified' ? 'bg-blue-500/20 text-blue-400' : st === 'Received' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400') : 'text-gray-500 hover:text-gray-300'}`}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="pt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">Overall Score:</span>
              <ReDocScoreBar score={re_calcDocScore(form.doc_checklist)} />
            </div>
          </div>
        )}

        {modalTab === 4 && (
          <ReFormField label="Notes" span={2}>
            <textarea className={`${reInputClass} min-h-[140px]`} value={form.notes} onChange={e => updateForm({ notes: e.target.value })} placeholder="Property notes..." />
          </ReFormField>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white border border-brand-border hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={re_handleSave} className="px-6 py-2 rounded-xl text-sm font-semibold bg-brand-re hover:bg-brand-re/90 text-white transition-all shadow-lg shadow-brand-re/20">
            {editing ? 'Update' : 'Add Property'}
          </button>
        </div>
      </ReModal>

      <ReConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) { onDelete(deleteId); onActivity('Deleted property', '', deleteId); } }} title="Delete Property" message="Are you sure? This action cannot be undone." />
    </div>
  );
};
