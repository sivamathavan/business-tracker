import React, { useState } from 'react';
import { type ReTabKey } from './re-types';
import { useReData, re_logActivity } from './re-hooks';
import { ReOverviewTab } from './ReOverviewTab';
import { RePeopleTab } from './RePeopleTab';
import { ReDealsTab } from './ReDealsTab';
import { RePropertiesTab } from './RePropertiesTab';
import { ReCommissionTab } from './ReCommissionTab';
import { ReAnalyticsTab } from './ReAnalyticsTab';
import { ReMatchTab } from './ReMatchTab';
import { ExpensesTab } from '../../components/ui/ExpensesTab';
import { RevenueHeroCard } from '../../components/ui/RevenueHeroCard';
import { 
  Home, Users, Handshake, Building2, Landmark, BarChart2, Wallet, Zap, CalendarDays
} from 'lucide-react';

const TABS_WITH_ICONS = [
  { key: 'overview', label: 'Overview', icon: Home },
  { key: 'people', label: 'People & Network', icon: Users },
  { key: 'deals', label: 'Deals', icon: Handshake },
  { key: 'properties', label: 'Properties', icon: Building2 },
  { key: 'match', label: 'Buyer Match', icon: Zap },
  { key: 'commission', label: 'Commission', icon: Landmark },
  { key: 'analytics', label: 'Analytics', icon: BarChart2 },
  { key: 'expenses', label: 'Expenses', icon: Wallet },
] as const;

export default function ReDashboard() {
  const [activeTab, setActiveTab] = useState<ReTabKey>('overview');

  const data = useReData();

  // Analytics Filter States
  const [analyticsDateType, setAnalyticsDateType] = useState<'lifetime' | 'month' | 'range'>('lifetime');
  const [analyticsMonthFilter, setAnalyticsMonthFilter] = useState('');
  const [analyticsStartDate, setAnalyticsStartDate] = useState('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('');

  // Fetch filtered analytics
  React.useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'overview') {
      const params: any = {};
      if (analyticsDateType === 'month' && analyticsMonthFilter) params.month = analyticsMonthFilter;
      if (analyticsDateType === 'range' && analyticsStartDate && analyticsEndDate) {
        params.startDate = analyticsStartDate;
        params.endDate = analyticsEndDate;
      }
      data.fetchAnalytics(params);
    }
  }, [activeTab, analyticsDateType, analyticsMonthFilter, analyticsStartDate, analyticsEndDate]);

  // Activity logger shorthand
  const re_logAct = (action: string, entity: string, id: string) =>
    re_logActivity(data.activities, data.setActivities, action, entity, id);

  // Filter lists for ReAnalyticsTab based on date
  const filterListByDate = (list: any[]) => {
    if (analyticsDateType === 'lifetime') return list;
    
    let start: Date | null = null;
    let end: Date | null = null;
    
    if (analyticsDateType === 'month' && analyticsMonthFilter) {
      const [year, mon] = analyticsMonthFilter.split('-').map(Number);
      if (year && mon) {
        start = new Date(year, mon - 1, 1);
        end = new Date(year, mon, 1);
      }
    } else if (analyticsDateType === 'range' && analyticsStartDate && analyticsEndDate) {
      start = new Date(analyticsStartDate);
      end = new Date(new Date(analyticsEndDate).getTime() + 24 * 60 * 60 * 1000);
    }

    if (!start || !end) return list;
    
    return list.filter(item => {
      const d = item.created_at ? new Date(item.created_at) : null;
      if (!d) return true;
      return d >= start! && d < end!;
    });
  };

  const filteredDeals = filterListByDate(data.deals);
  const filteredCommissions = filterListByDate(data.commissions);

  return (
    <div id="re-dashboard" className="space-y-6">
      {/* Tab Navigation */}
      <div id="re-tab-nav" className="flex flex-wrap gap-2 border-b border-brand-border pb-4">
        {TABS_WITH_ICONS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              id={`re-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none ${
                activeTab === tab.key
                  ? 'bg-brand-re/10 text-brand-re border border-brand-re/30 shadow-[0_0_10px_rgba(255,107,107,0.1)]'
                  : 'bg-brand-card border border-brand-border text-slate-400 hover:text-white hover:border-brand-re/40'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Revenue Card Hero */}
      {data.reStats && (
        <RevenueHeroCard
          collected={data.reStats.totalCollectedCommission}
          pending={data.reStats.totalPendingCommission}
          growthRate={60.0}
          type="realestate"
        />
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <ReOverviewTab
          people={data.people}
          deals={data.deals}
          properties={data.properties}
          commissions={data.commissions}
          activities={data.activities}
          reStats={data.reStats}
        />
      )}

      {activeTab === 'people' && (
        <RePeopleTab
          people={data.people}
          properties={data.properties}
          onSave={data.re_savePerson}
          onDelete={data.re_deletePerson}
          onTogglePin={data.re_togglePinPerson}
          onActivity={re_logAct}
        />
      )}

      {activeTab === 'deals' && (
        <ReDealsTab
          deals={data.deals}
          onSave={data.re_saveDeal}
          onDelete={data.re_deleteDeal}
          onUpdateStatus={data.re_updateDealStatus}
          onActivity={re_logAct}
        />
      )}

      {activeTab === 'properties' && (
        <RePropertiesTab
          properties={data.properties}
          onSave={data.re_saveProperty}
          onDelete={data.re_deleteProperty}
          onActivity={re_logAct}
        />
      )}

      {activeTab === 'commission' && (
        <ReCommissionTab
          commissions={data.commissions}
          payouts={data.payouts}
          peoplePayments={data.peoplePayments}
          deals={data.deals}
          onSaveCommission={data.re_saveCommission}
          onSavePayout={data.re_savePayout}
          onSavePeoplePayment={data.re_savePeoplePayment}
          onActivity={re_logAct}
        />
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Filters */}
          <div className="bg-brand-card/60 border border-brand-border/60 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <select
                value={analyticsDateType}
                onChange={(e) => setAnalyticsDateType(e.target.value as any)}
                className="pl-3 pr-8 py-1.5 rounded-lg text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="lifetime">Lifetime</option>
                <option value="month">Specific Month</option>
                <option value="range">Custom Range</option>
              </select>
            </div>

            {analyticsDateType === 'month' && (
              <input
                type="month"
                value={analyticsMonthFilter}
                onChange={(e) => setAnalyticsMonthFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            )}

            {analyticsDateType === 'range' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={analyticsStartDate}
                  onChange={(e) => setAnalyticsStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 text-slate-300 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-500 text-xs font-bold">TO</span>
                <input
                  type="date"
                  value={analyticsEndDate}
                  onChange={(e) => setAnalyticsEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-dark/40 border border-brand-border/60 text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          <ReAnalyticsTab
            people={data.people}
            deals={filteredDeals}
            properties={data.properties}
            commissions={filteredCommissions}
          />
        </div>
      )}

      {activeTab === 'match' && (
        <ReMatchTab
          people={data.people}
          properties={data.properties}
        />
      )}

      {activeTab === 'expenses' && (
        <ExpensesTab businessSlug="realestate" onSave={data.fetchData} />
      )}
    </div>
  );
}
