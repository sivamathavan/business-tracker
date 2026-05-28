// ═══════════════════════════════════════════════════════════
// AadanaTharakar — Main Dashboard Component
// ═══════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { RE_TABS, type ReTabKey } from './re-types';
import { useReData, re_logActivity } from './re-hooks';
import { ReOverviewTab } from './ReOverviewTab';
import { RePeopleTab } from './RePeopleTab';
import { ReDealsTab } from './ReDealsTab';
import { RePropertiesTab } from './RePropertiesTab';
import { ReCommissionTab } from './ReCommissionTab';
import { ReAnalyticsTab } from './ReAnalyticsTab';

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
        {RE_TABS.map(tab => (
          <button
            key={tab.key}
            id={`re-tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-brand-re text-white shadow-lg shadow-brand-re/25'
                : 'bg-brand-card border border-brand-border text-gray-400 hover:text-white hover:border-brand-re/40'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

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
    </div>
  );
}
