import React, { useState } from 'react';
import { type ReTabKey } from './re-types';
import { useReData, re_logActivity } from './re-hooks';
import { ReOverviewTab } from './ReOverviewTab';
import { RePeopleTab } from './RePeopleTab';
import { ReDealsTab } from './ReDealsTab';
import { RePropertiesTab } from './RePropertiesTab';
import { ReCommissionTab } from './ReCommissionTab';
import { ReAnalyticsTab } from './ReAnalyticsTab';
import { ExpensesTab } from '../../components/ui/ExpensesTab';
import { RevenueHeroCard } from '../../components/ui/RevenueHeroCard';
import { 
  Home, Users, Handshake, Building2, Landmark, BarChart2, Wallet 
} from 'lucide-react';

const TABS_WITH_ICONS = [
  { key: 'overview', label: 'Overview', icon: Home },
  { key: 'people', label: 'People & Network', icon: Users },
  { key: 'deals', label: 'Deals', icon: Handshake },
  { key: 'properties', label: 'Properties', icon: Building2 },
  { key: 'commission', label: 'Commission', icon: Landmark },
  { key: 'analytics', label: 'Analytics', icon: BarChart2 },
  { key: 'expenses', label: 'Expenses', icon: Wallet },
] as const;

export default function ReDashboard() {
  const [activeTab, setActiveTab] = useState<ReTabKey>('overview');

  const data = useReData();

  // Activity logger shorthand
  const re_logAct = (action: string, entity: string, id: string) =>
    re_logActivity(data.activities, data.setActivities, action, entity, id);

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
        <ReAnalyticsTab
          people={data.people}
          deals={data.deals}
          properties={data.properties}
          commissions={data.commissions}
        />
      )}

      {activeTab === 'expenses' && (
        <ExpensesTab businessSlug="realestate" onSave={data.fetchData} />
      )}
    </div>
  );
}
