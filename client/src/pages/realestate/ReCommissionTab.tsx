// ═══════════════════════════════════════
// DreamKey Properties — Commission Tab
// ═══════════════════════════════════════
import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Edit3, Trash2, Download, CheckCircle2 } from 'lucide-react';
import { RE_DEAL_TYPES, RE_COMMISSION_PILLS, re_id, type ReCommissionRecord, type RePayout, type RePeoplePayment, type ReDeal, type ReCommPill } from './re-types';
import { ReModal, ReBadge, ReDealTypeBadge, ReEmptyState, ReFormField, ReConfirm, ReStatCard, reInputClass } from './re-ui';
import { formatINR } from '../../utils/formatters';
import { exportToCSV, exportToPDF } from '../../utils/exportHelpers';

interface Props {
  commissions: ReCommissionRecord[];
  payouts: RePayout[];
  peoplePayments: RePeoplePayment[];
  deals: ReDeal[];
  onSaveCommission: (c: ReCommissionRecord, isEdit: boolean) => void;
  onSavePayout: (p: RePayout, isEdit: boolean) => void;
  onSavePeoplePayment: (p: RePeoplePayment, isEdit: boolean) => void;
  onActivity: (action: string, entity: string, id: string) => void;
}

export const ReCommissionTab: React.FC<Props> = ({ commissions, payouts, peoplePayments, deals, onSaveCommission, onSavePayout, onSavePeoplePayment, onActivity }) => {
  const [activePill, setActivePill] = useState<ReCommPill>('Calculator');

  // Calculator state
  const [calcValue, setCalcValue] = useState(0);
  const [calcSellerRate, setCalcSellerRate] = useState(1.5);
  const [calcBuyerRate, setCalcBuyerRate] = useState(1.0);
  const [calcType, setCalcType] = useState('Both Side Broker');

  // Commission form
  const [commModal, setCommModal] = useState(false);
  const [commForm, setCommForm] = useState<ReCommissionRecord>({
    id: '', deal_id: '', deal_title: '', deal_type: 'Both Side Broker', total_value: 0,
    commission_expected: 0, commission_received: 0, payout_amount: 0, status: 'Pending', date: '',
  });
  const [commEditing, setCommEditing] = useState(false);

  // Payout form
  const [payoutModal, setPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState<RePayout>({
    id: '', person_id: '', person_name: '', deal_id: '', deal_title: '', amount: 0, paid: false, date: '', notes: '',
  });

  // People payment form
  const [ppModal, setPpModal] = useState(false);
  const [ppForm, setPpForm] = useState<RePeoplePayment>({
    id: '', person_id: '', person_name: '', deal_id: '', deal_title: '', amount: 0, received: false, date: '', notes: '',
  });

  // Stats
  const stats = useMemo(() => {
    const totalExpected = commissions.reduce((s, c) => s + Number(c.commission_expected), 0) + deals.reduce((s, d) => s + Number(d.commission_amount), 0);
    const totalReceived = commissions.reduce((s, c) => s + Number(c.commission_received), 0) + deals.reduce((s, d) => s + Number(d.commission_received), 0);
    const totalPayouts = payouts.filter(p => p.paid).reduce((s, p) => s + Number(p.amount), 0);
    const pendingPayouts = payouts.filter(p => !p.paid).reduce((s, p) => s + Number(p.amount), 0);
    const netCommission = totalReceived - totalPayouts;
    const ppReceived = peoplePayments.filter(p => p.received).reduce((s, p) => s + Number(p.amount), 0);
    const ppPending = peoplePayments.filter(p => !p.received).reduce((s, p) => s + Number(p.amount), 0);
    return { totalExpected, totalReceived, totalPayouts, pendingPayouts, netCommission, ppReceived, ppPending };
  }, [commissions, payouts, peoplePayments]);

  // Calculator logic
  const calcResult = useMemo(() => {
    let sellerComm = 0, buyerComm = 0;
    if (calcType === 'Both Side Broker') {
      sellerComm = calcValue * calcSellerRate / 100;
      buyerComm = calcValue * calcBuyerRate / 100;
    } else if (calcType === 'Buyer Side Only') {
      buyerComm = calcValue * calcBuyerRate / 100;
    } else if (calcType === 'Seller Side Only') {
      sellerComm = calcValue * calcSellerRate / 100;
    } else {
      sellerComm = calcValue * calcSellerRate / 100;
    }
    const total = sellerComm + buyerComm;
    const gst = total * 0.18;
    const tds = total * 0.05;
    const netReceivable = total - gst - tds;
    return { sellerComm, buyerComm, total, gst, tds, netReceivable };
  }, [calcValue, calcSellerRate, calcBuyerRate, calcType]);

  return (
    <div className="space-y-5">
      {/* Pill nav */}
      <div id="re-commission-pills" className="flex flex-wrap gap-2">
        {RE_COMMISSION_PILLS.map(pill => (
          <button key={pill} onClick={() => setActivePill(pill)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activePill === pill ? 'bg-brand-re text-white shadow-lg shadow-brand-re/30' : 'bg-brand-card border border-brand-border text-gray-400 hover:text-white hover:border-brand-re/50'}`}>
            {pill}
          </button>
        ))}
      </div>

      {/* ══════════ Calculator ══════════ */}
      {activePill === 'Calculator' && (
        <div className="max-w-2xl">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Calculator className="text-brand-re" size={24} />
              <h4 className="font-heading font-bold text-white text-lg">Commission Calculator</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <ReFormField label="Deal Type">
                <select className={reInputClass} value={calcType} onChange={e => setCalcType(e.target.value)}>
                  {RE_DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </ReFormField>
              <ReFormField label="Property Value (₹)">
                <input className={reInputClass} type="number" value={calcValue} onChange={e => setCalcValue(+e.target.value)} />
              </ReFormField>
              <ReFormField label="Seller Side Rate %">
                <input className={reInputClass} type="number" step="0.1" value={calcSellerRate} onChange={e => setCalcSellerRate(+e.target.value)} />
              </ReFormField>
              <ReFormField label="Buyer Side Rate %">
                <input className={reInputClass} type="number" step="0.1" value={calcBuyerRate} onChange={e => setCalcBuyerRate(+e.target.value)} />
              </ReFormField>
            </div>
            <div className="bg-brand-dark rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Seller Side Commission</span><span className="text-white font-semibold">{formatINR(calcResult.sellerComm)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Buyer Side Commission</span><span className="text-white font-semibold">{formatINR(calcResult.buyerComm)}</span></div>
              <div className="border-t border-brand-border pt-2 flex justify-between text-sm"><span className="text-gray-400">Total Gross Commission</span><span className="text-brand-re font-bold">{formatINR(calcResult.total)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">GST (18%)</span><span className="text-red-400">-{formatINR(calcResult.gst)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">TDS (5%)</span><span className="text-red-400">-{formatINR(calcResult.tds)}</span></div>
              <div className="border-t border-brand-border pt-2 flex justify-between"><span className="text-gray-300 font-semibold">Net Receivable</span><span className="text-emerald-400 font-heading font-bold text-lg">{formatINR(calcResult.netReceivable)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Deal Records ══════════ */}
      {activePill === 'Deal Records' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <ReStatCard icon="📊" label="Total Expected" value={formatINR(stats.totalExpected)} accent />
            <ReStatCard icon="📥" label="Total Received" value={formatINR(stats.totalReceived)} />
            <ReStatCard icon="⏳" label="Pending" value={formatINR(stats.totalExpected - stats.totalReceived)} />
            <ReStatCard icon="📑" label="Records" value={commissions.length} />
          </div>
          <div className="flex justify-between items-center">
            <h4 className="font-heading font-bold text-white">Commission Records</h4>
            <button onClick={() => { setCommEditing(false); setCommForm({ id: re_id(), deal_id: '', deal_title: '', deal_type: 'Both Side Broker', total_value: 0, commission_expected: 0, commission_received: 0, payout_amount: 0, status: 'Pending', date: new Date().toISOString().slice(0, 10) }); setCommModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-re hover:bg-brand-re/90 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-re/20">
              <Plus size={16} /> Add Record
            </button>
          </div>
          {commissions.length === 0 ? (
            <ReEmptyState icon="💰" title="No commission records" sub="Add records to track your earnings" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-brand-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-card/80">
                    {['Deal', 'Type', 'Value', 'Expected', 'Received', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {commissions.map(c => (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white font-semibold max-w-[180px] truncate">{c.deal_title}</td>
                      <td className="px-4 py-3"><ReDealTypeBadge type={c.deal_type} /></td>
                      <td className="px-4 py-3 text-gray-300">{formatINR(c.total_value)}</td>
                      <td className="px-4 py-3 text-brand-re font-semibold">{formatINR(c.commission_expected)}</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">{formatINR(c.commission_received)}</td>
                      <td className="px-4 py-3"><ReBadge label={c.status} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setCommEditing(true); setCommForm({ ...c }); setCommModal(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"><Edit3 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════ People Commission ══════════ */}
      {activePill === 'People Commission' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ReStatCard icon="📥" label="Received from People" value={formatINR(stats.ppReceived)} accent />
            <ReStatCard icon="⏳" label="Pending from People" value={formatINR(stats.ppPending)} />
            <ReStatCard icon="📑" label="Records" value={peoplePayments.length} />
          </div>
          <div className="flex justify-between items-center">
            <h4 className="font-heading font-bold text-white">Commission from People</h4>
            <button onClick={() => { setPpForm({ id: re_id(), person_id: '', person_name: '', deal_id: '', deal_title: '', amount: 0, received: false, date: new Date().toISOString().slice(0, 10), notes: '' }); setPpModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-re hover:bg-brand-re/90 text-white rounded-xl text-sm font-semibold transition-all">
              <Plus size={16} /> Add
            </button>
          </div>
          {peoplePayments.length === 0 ? (
            <ReEmptyState icon="👥" title="No records yet" sub="Track commission received from brokers and partners" />
          ) : (
            <div className="space-y-2">
              {peoplePayments.map(pp => (
                <div key={pp.id} className="flex items-center gap-4 bg-brand-card border border-brand-border rounded-xl p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{pp.person_name}</p>
                    <p className="text-xs text-gray-500">{pp.deal_title} • {pp.date}</p>
                  </div>
                  <span className="text-brand-re font-bold">{formatINR(pp.amount)}</span>
                  <ReBadge label={pp.received ? 'Received' : 'Pending'} />
                  {!pp.received && (
                    <button onClick={() => { onSavePeoplePayment({ ...pp, received: true }, true); onActivity('Marked received', pp.person_name, pp.id); }}
                      className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"><CheckCircle2 size={16} /></button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ Payouts ══════════ */}
      {activePill === 'Payouts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ReStatCard icon="💸" label="Total Paid Out" value={formatINR(stats.totalPayouts)} accent />
            <ReStatCard icon="⏳" label="Pending Payouts" value={formatINR(stats.pendingPayouts)} />
            <ReStatCard icon="📑" label="Records" value={payouts.length} />
          </div>
          <div className="flex justify-between items-center">
            <h4 className="font-heading font-bold text-white">Payout Records</h4>
            <button onClick={() => { setPayoutForm({ id: re_id(), person_id: '', person_name: '', deal_id: '', deal_title: '', amount: 0, paid: false, date: new Date().toISOString().slice(0, 10), notes: '' }); setPayoutModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-re hover:bg-brand-re/90 text-white rounded-xl text-sm font-semibold transition-all">
              <Plus size={16} /> Add Payout
            </button>
          </div>
          {payouts.length === 0 ? (
            <ReEmptyState icon="💸" title="No payouts yet" sub="Track payouts to brokers and partners" />
          ) : (
            <div className="space-y-2">
              {payouts.map(p => (
                <div key={p.id} className="flex items-center gap-4 bg-brand-card border border-brand-border rounded-xl p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{p.person_name}</p>
                    <p className="text-xs text-gray-500">{p.deal_title} • {p.date}</p>
                  </div>
                  <span className="text-orange-400 font-bold">{formatINR(p.amount)}</span>
                  <ReBadge label={p.paid ? 'Completed' : 'Pending'} />
                  {!p.paid && (
                    <button onClick={() => { onSavePayout({ ...p, paid: true }, true); onActivity('Payout completed', p.person_name, p.id); }}
                      className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"><CheckCircle2 size={16} /></button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ Net Summary ══════════ */}
      {activePill === 'Net Summary' && (
        <div className="max-w-xl space-y-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-3">
            <h4 className="font-heading font-bold text-white text-lg mb-4">Net Commission Summary</h4>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Total Commission Expected</span><span className="text-white font-semibold">{formatINR(stats.totalExpected)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Total Commission Received</span><span className="text-emerald-400 font-semibold">{formatINR(stats.totalReceived)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Commission from People</span><span className="text-blue-400 font-semibold">{formatINR(stats.ppReceived)}</span></div>
            <div className="border-t border-brand-border pt-2 flex justify-between text-sm"><span className="text-gray-400">Total Payouts Made</span><span className="text-orange-400 font-semibold">-{formatINR(stats.totalPayouts)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Pending Payouts</span><span className="text-yellow-400">-{formatINR(stats.pendingPayouts)}</span></div>
            <div className="border-t-2 border-brand-re/30 pt-3 flex justify-between"><span className="text-white font-heading font-bold">Net in Hand</span><span className="text-brand-re font-heading font-bold text-2xl">{formatINR(stats.netCommission)}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => {
              const data = [{ 'Expected': stats.totalExpected, 'Received': stats.totalReceived, 'Payouts': stats.totalPayouts, 'Net': stats.netCommission }];
              exportToCSV(data, 'dreamkey_commission_summary');
            }} className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-brand-border rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={() => {
              exportToPDF('DreamKey — Net Summary', ['Metric', 'Amount'], [
                ['Expected', formatINR(stats.totalExpected)], ['Received', formatINR(stats.totalReceived)],
                ['Payouts', formatINR(stats.totalPayouts)], ['Net', formatINR(stats.netCommission)],
              ], 'dreamkey_net_summary', [255, 107, 107]);
            }} className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-brand-border rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>
      )}

      {/* ═══ Modals ═══ */}
      <ReModal open={commModal} onClose={() => setCommModal(false)} title={commEditing ? 'Edit Commission' : 'Add Commission Record'}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReFormField label="Deal Title *" span={2}>
            <input className={reInputClass} value={commForm.deal_title} onChange={e => setCommForm(f => ({ ...f, deal_title: e.target.value }))} />
          </ReFormField>
          <ReFormField label="Deal Type">
            <select className={reInputClass} value={commForm.deal_type} onChange={e => setCommForm(f => ({ ...f, deal_type: e.target.value as any }))}>
              {RE_DEAL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </ReFormField>
          <ReFormField label="Total Value (₹)">
            <input className={reInputClass} type="number" value={commForm.total_value} onChange={e => setCommForm(f => ({ ...f, total_value: +e.target.value }))} />
          </ReFormField>
          <ReFormField label="Expected (₹)">
            <input className={reInputClass} type="number" value={commForm.commission_expected} onChange={e => setCommForm(f => ({ ...f, commission_expected: +e.target.value }))} />
          </ReFormField>
          <ReFormField label="Received (₹)">
            <input className={reInputClass} type="number" value={commForm.commission_received} onChange={e => setCommForm(f => ({ ...f, commission_received: +e.target.value }))} />
          </ReFormField>
          <ReFormField label="Status">
            <select className={reInputClass} value={commForm.status} onChange={e => setCommForm(f => ({ ...f, status: e.target.value as any }))}>
              {['Pending', 'Partial', 'Completed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </ReFormField>
          <ReFormField label="Date">
            <input className={reInputClass} type="date" value={commForm.date} onChange={e => setCommForm(f => ({ ...f, date: e.target.value }))} />
          </ReFormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
          <button onClick={() => setCommModal(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-brand-border hover:bg-white/5">Cancel</button>
          <button onClick={() => { onSaveCommission(commForm, commEditing); onActivity(commEditing ? 'Updated commission' : 'Added commission', commForm.deal_title, commForm.id); setCommModal(false); }}
            className="px-6 py-2 rounded-xl text-sm font-semibold bg-brand-re text-white">Save</button>
        </div>
      </ReModal>

      <ReModal open={payoutModal} onClose={() => setPayoutModal(false)} title="Add Payout">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReFormField label="Person Name *">
            <input className={reInputClass} value={payoutForm.person_name} onChange={e => setPayoutForm(f => ({ ...f, person_name: e.target.value }))} />
          </ReFormField>
          <ReFormField label="Deal Title">
            <input className={reInputClass} value={payoutForm.deal_title} onChange={e => setPayoutForm(f => ({ ...f, deal_title: e.target.value }))} />
          </ReFormField>
          <ReFormField label="Amount (₹)">
            <input className={reInputClass} type="number" value={payoutForm.amount} onChange={e => setPayoutForm(f => ({ ...f, amount: +e.target.value }))} />
          </ReFormField>
          <ReFormField label="Date">
            <input className={reInputClass} type="date" value={payoutForm.date} onChange={e => setPayoutForm(f => ({ ...f, date: e.target.value }))} />
          </ReFormField>
          <ReFormField label="Notes" span={2}>
            <input className={reInputClass} value={payoutForm.notes} onChange={e => setPayoutForm(f => ({ ...f, notes: e.target.value }))} />
          </ReFormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
          <button onClick={() => setPayoutModal(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-brand-border hover:bg-white/5">Cancel</button>
          <button onClick={() => { onSavePayout(payoutForm, false); onActivity('Added payout', payoutForm.person_name, payoutForm.id); setPayoutModal(false); }}
            className="px-6 py-2 rounded-xl text-sm font-semibold bg-brand-re text-white">Save</button>
        </div>
      </ReModal>

      <ReModal open={ppModal} onClose={() => setPpModal(false)} title="Add People Commission">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReFormField label="Person Name *">
            <input className={reInputClass} value={ppForm.person_name} onChange={e => setPpForm(f => ({ ...f, person_name: e.target.value }))} />
          </ReFormField>
          <ReFormField label="Deal Title">
            <input className={reInputClass} value={ppForm.deal_title} onChange={e => setPpForm(f => ({ ...f, deal_title: e.target.value }))} />
          </ReFormField>
          <ReFormField label="Amount (₹)">
            <input className={reInputClass} type="number" value={ppForm.amount} onChange={e => setPpForm(f => ({ ...f, amount: +e.target.value }))} />
          </ReFormField>
          <ReFormField label="Date">
            <input className={reInputClass} type="date" value={ppForm.date} onChange={e => setPpForm(f => ({ ...f, date: e.target.value }))} />
          </ReFormField>
          <ReFormField label="Notes" span={2}>
            <input className={reInputClass} value={ppForm.notes} onChange={e => setPpForm(f => ({ ...f, notes: e.target.value }))} />
          </ReFormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
          <button onClick={() => setPpModal(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-brand-border hover:bg-white/5">Cancel</button>
          <button onClick={() => { onSavePeoplePayment(ppForm, false); onActivity('Added people commission', ppForm.person_name, ppForm.id); setPpModal(false); }}
            className="px-6 py-2 rounded-xl text-sm font-semibold bg-brand-re text-white">Save</button>
        </div>
      </ReModal>
    </div>
  );
};
