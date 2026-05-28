// ═══════════════════════════════════════
// DreamKey Properties — Analytics Tab
// ═══════════════════════════════════════
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { ReStatCard } from './re-ui';
import { re_getMonthKey } from './re-hooks';
import { formatINR } from '../../utils/formatters';
import type { RePerson, ReDeal, ReProperty, ReCommissionRecord } from './re-types';

const COLORS = ['#ff6b6b', '#6c63ff', '#43e97b', '#f7b731', '#00cec9', '#e056a0', '#fd79a8', '#74b9ff'];

interface Props {
  people: RePerson[];
  deals: ReDeal[];
  properties: ReProperty[];
  commissions: ReCommissionRecord[];
}

export const ReAnalyticsTab: React.FC<Props> = ({ people, deals, properties, commissions }) => {
  // District breakdown
  const districtData = useMemo(() => {
    const map = new Map<string, { deals: number; value: number }>();
    deals.forEach(d => {
      const cur = map.get(d.district) || { deals: 0, value: 0 };
      cur.deals++; cur.value += d.property_value;
      map.set(d.district, cur);
    });
    return Array.from(map.entries())
      .map(([district, data]) => ({ district, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [deals]);

  // Property type distribution
  const propTypePie = useMemo(() => {
    const map = new Map<string, number>();
    properties.forEach(p => map.set(p.property_type, (map.get(p.property_type) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [properties]);

  // Deal status funnel
  const statusFunnel = useMemo(() => {
    const order = ['New Lead', 'Site Visit Done', 'Negotiation', 'Token Paid', 'Agreement Signed', 'Registration Done', 'Completed', 'Dropped'];
    const map = new Map<string, number>();
    order.forEach(s => map.set(s, 0));
    deals.forEach(d => map.set(d.status, (map.get(d.status) || 0) + 1));
    return order.map(s => ({ status: s, count: map.get(s) || 0 }));
  }, [deals]);

  // Monthly deal value trend
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, { value: number; commission: number }>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, { value: 0, commission: 0 });
    }
    deals.forEach(d => {
      const key = re_getMonthKey(d.created_at);
      if (map.has(key)) {
        const cur = map.get(key)!;
        cur.value += d.property_value;
        cur.commission += d.commission_amount;
      }
    });
    return Array.from(map.entries()).map(([k, v]) => {
      const [y, m] = k.split('-');
      return { month: new Date(+y, +m - 1).toLocaleString('en', { month: 'short' }), ...v };
    });
  }, [deals]);

  // Person type breakdown
  const personTypePie = useMemo(() => {
    const map = new Map<string, number>();
    people.forEach(p => map.set(p.person_type, (map.get(p.person_type) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [people]);

  // Top earners
  const topEarners = useMemo(() => {
    return [...people].filter(p => p.total_commission > 0).sort((a, b) => b.total_commission - a.total_commission).slice(0, 5);
  }, [people]);

  // KPIs
  const kpis = useMemo(() => {
    const totalDealValue = deals.reduce((s, d) => s + Number(d.property_value), 0);
    const avgDealSize = deals.length > 0 ? totalDealValue / deals.length : 0;
    const convRate = deals.length > 0 ? Math.round((deals.filter(d => d.status === 'Completed').length / deals.length) * 100) : 0;
    const avgCommRate = deals.length > 0 ? deals.reduce((s, d) => s + Number(d.commission_rate_seller) + Number(d.commission_rate_buyer), 0) / deals.length : 0;
    return { totalDealValue, avgDealSize, convRate, avgCommRate };
  }, [deals]);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReStatCard icon="📊" label="Total Deal Value" value={formatINR(kpis.totalDealValue)} accent />
        <ReStatCard icon="📐" label="Avg Deal Size" value={formatINR(kpis.avgDealSize)} />
        <ReStatCard icon="🎯" label="Conversion Rate" value={`${kpis.convRate}%`} />
        <ReStatCard icon="📈" label="Avg Commission Rate" value={`${kpis.avgCommRate.toFixed(1)}%`} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Value + Commission Trend */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
          <h4 className="font-heading font-bold text-white mb-4">Monthly Trend (6 Months)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 12, color: '#fff' }} formatter={(v: number) => formatINR(v)} />
              <Legend />
              <Line type="monotone" dataKey="value" name="Deal Value" stroke="#ff6b6b" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="commission" name="Commission" stroke="#43e97b" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Deal Status Funnel */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
          <h4 className="font-heading font-bold text-white mb-4">Deal Pipeline Funnel</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusFunnel} layout="vertical">
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="status" tick={{ fill: '#9ca3af', fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="count" fill="#ff6b6b" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Breakdown */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
          <h4 className="font-heading font-bold text-white mb-4">Top Districts by Value</h4>
          {districtData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={districtData}>
                <XAxis dataKey="district" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 12, color: '#fff' }} formatter={(v: number) => formatINR(v)} />
                <Bar dataKey="value" fill="#ff6b6b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[250px] text-gray-500 text-sm">No data</div>}
        </div>

        {/* Property Type Pie */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
          <h4 className="font-heading font-bold text-white mb-4">Properties by Type</h4>
          {propTypePie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={propTypePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {propTypePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 12, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {propTypePie.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /> {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </>
          ) : <div className="flex items-center justify-center h-[250px] text-gray-500 text-sm">No data</div>}
        </div>

        {/* Person Type Pie */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
          <h4 className="font-heading font-bold text-white mb-4">Network by Type</h4>
          {personTypePie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={personTypePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {personTypePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 12, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {personTypePie.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /> {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </>
          ) : <div className="flex items-center justify-center h-[250px] text-gray-500 text-sm">No data</div>}
        </div>
      </div>

      {/* Top Earners */}
      {topEarners.length > 0 && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
          <h4 className="font-heading font-bold text-white mb-4">Top Commission Earners</h4>
          <div className="space-y-2">
            {topEarners.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 py-2 border-b border-brand-border/30 last:border-0">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-brand-re/20 text-brand-re' : 'bg-brand-dark text-gray-400'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.person_type} • {p.district}</p>
                </div>
                <span className="text-brand-re font-heading font-bold">{formatINR(p.total_commission)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
