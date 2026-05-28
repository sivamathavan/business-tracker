// ═══════════════════════════════════════
// AadanaTharakar — Hooks & Helpers (API Wired)
// ═══════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/apiClient';
import {
  re_id,
  type RePerson, type ReDeal, type ReProperty, type ReCommissionRecord,
  type RePayout, type RePeoplePayment, type ReActivity,
} from './re-types';

export function re_logActivity(
  activities: ReActivity[],
  setActivities: React.Dispatch<React.SetStateAction<ReActivity[]>>,
  action: string, entity: string, entity_id: string,
) {
  const entry = { action, entity, entity_id };
  apiClient.post('/re/activity', entry).then(res => {
    if (res.data?.success) setActivities(prev => [res.data.data, ...prev].slice(0, 100));
  }).catch(() => {});
}

export interface ReApiStats {
  totalDeals: number;
  closedDeals: number;
  pendingDeals: number;
  totalExpectedCommission: number;
  totalCollectedCommission: number;
  totalPendingCommission: number;
  activeBrokers: number;
  availableProperties: number;
}

export function useReData() {
  const [people, setPeople] = useState<RePerson[]>([]);
  const [deals, setDeals] = useState<ReDeal[]>([]);
  const [properties, setProperties] = useState<ReProperty[]>([]);
  const [commissions, setCommissions] = useState<ReCommissionRecord[]>([]);
  const [payouts, setPayouts] = useState<RePayout[]>([]);
  const [peoplePayments, setPeoplePayments] = useState<RePeoplePayment[]>([]);
  const [activities, setActivities] = useState<ReActivity[]>([]);
  const [reStats, setReStats] = useState<ReApiStats | null>(null);

  const fetchData = async () => {
    try {
      const [ppl, dls, props, comms, pays, pPays, acts, stats] = await Promise.all([
        apiClient.get('/re/people'),
        apiClient.get('/re/deals'),
        apiClient.get('/re/properties'),
        apiClient.get('/re/commissions'),
        apiClient.get('/re/payouts'),
        apiClient.get('/re/people-payments'),
        apiClient.get('/re/activity'),
        apiClient.get('/re/analytics')
      ]);

      if (ppl.data.success) setPeople(ppl.data.data);
      if (dls.data.success) setDeals(dls.data.data);
      if (props.data.success) setProperties(props.data.data);
      if (comms.data.success) setCommissions(comms.data.data);
      if (pays.data.success) setPayouts(pays.data.data);
      if (pPays.data.success) setPeoplePayments(pPays.data.data);
      if (acts.data.success) setActivities(acts.data.data);
      if (stats.data.success) setReStats(stats.data.analytics);
    } catch (error) {
      console.error("Failed to load RE data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── People CRUD ─────────────────────
  const re_savePerson = useCallback(async (p: RePerson, isEdit: boolean) => {
    try {
      if (isEdit) {
        await apiClient.put(`/re/people/${p.id}`, p);
        setPeople(prev => prev.map(x => x.id === p.id ? p : x));
      } else {
        const res = await apiClient.post('/re/people', p);
        setPeople(prev => [res.data.data, ...prev]);
      }
      toast.success(isEdit ? 'Person updated' : 'Person added');
    } catch (e) { toast.error('Error saving person'); }
  }, []);

  const re_deletePerson = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/re/people/${id}`);
      setPeople(prev => prev.filter(x => x.id !== id));
      toast.success('Person removed');
    } catch (e) { toast.error('Error deleting person'); }
  }, []);

  const re_togglePinPerson = useCallback(async (id: string) => {
    const person = people.find(p => p.id === id);
    if (!person) return;
    try {
      await apiClient.put(`/re/people/${id}`, { pinned: !person.pinned });
      setPeople(prev => prev.map(x => x.id === id ? { ...x, pinned: !x.pinned } : x));
    } catch (e) { toast.error('Error pinning'); }
  }, [people]);

  // ── Deals CRUD ──────────────────────
  const re_saveDeal = useCallback(async (d: ReDeal, isEdit: boolean) => {
    try {
      if (isEdit) {
        await apiClient.put(`/re/deals/${d.id}`, d);
        setDeals(prev => prev.map(x => x.id === d.id ? d : x));
      } else {
        const res = await apiClient.post('/re/deals', d);
        setDeals(prev => [res.data.data, ...prev]);
      }
      toast.success(isEdit ? 'Deal updated' : 'Deal added');
    } catch (e) { toast.error('Error saving deal'); }
  }, []);

  const re_deleteDeal = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/re/deals/${id}`);
      setDeals(prev => prev.filter(x => x.id !== id));
      toast.success('Deal removed');
    } catch (e) { toast.error('Error deleting deal'); }
  }, []);

  const re_updateDealStatus = useCallback(async (id: string, status: ReDeal['status']) => {
    try {
      await apiClient.put(`/re/deals/${id}`, { status });
      setDeals(prev => prev.map(x => x.id === id ? { ...x, status } : x));
    } catch (e) { toast.error('Error updating status'); }
  }, []);

  // ── Properties CRUD ─────────────────
  const re_saveProperty = useCallback(async (p: ReProperty, isEdit: boolean) => {
    try {
      if (isEdit) {
        await apiClient.put(`/re/properties/${p.id}`, p);
        setProperties(prev => prev.map(x => x.id === p.id ? p : x));
      } else {
        const res = await apiClient.post('/re/properties', p);
        setProperties(prev => [res.data.data, ...prev]);
      }
      toast.success(isEdit ? 'Property updated' : 'Property added');
    } catch (e) { toast.error('Error saving property'); }
  }, []);

  const re_deleteProperty = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/re/properties/${id}`);
      setProperties(prev => prev.filter(x => x.id !== id));
      toast.success('Property removed');
    } catch (e) { toast.error('Error deleting property'); }
  }, []);

  // ── Commission CRUD ─────────────────
  const re_saveCommission = useCallback(async (c: ReCommissionRecord, isEdit: boolean) => {
    try {
      if (isEdit) {
        await apiClient.put(`/re/commissions/${c.id}`, c);
        setCommissions(prev => prev.map(x => x.id === c.id ? c : x));
      } else {
        const res = await apiClient.post('/re/commissions', c);
        setCommissions(prev => [res.data.data, ...prev]);
      }
    } catch (e) { toast.error('Error saving commission'); }
  }, []);

  const re_savePayout = useCallback(async (p: RePayout, isEdit: boolean) => {
    try {
      if (isEdit) {
        await apiClient.put(`/re/payouts/${p.id}`, p);
        setPayouts(prev => prev.map(x => x.id === p.id ? p : x));
      } else {
        const res = await apiClient.post('/re/payouts', p);
        setPayouts(prev => [res.data.data, ...prev]);
      }
    } catch (e) { toast.error('Error saving payout'); }
  }, []);

  const re_savePeoplePayment = useCallback(async (p: RePeoplePayment, isEdit: boolean) => {
    try {
      if (isEdit) {
        await apiClient.put(`/re/people-payments/${p.id}`, p);
        setPeoplePayments(prev => prev.map(x => x.id === p.id ? p : x));
      } else {
        const res = await apiClient.post('/re/people-payments', p);
        setPeoplePayments(prev => [res.data.data, ...prev]);
      }
    } catch (e) { toast.error('Error saving payment'); }
  }, []);

  return {
    people, setPeople, deals, setDeals, properties, setProperties,
    commissions, setCommissions, payouts, setPayouts,
    peoplePayments, setPeoplePayments, activities, setActivities,
    reStats,
    re_savePerson, re_deletePerson, re_togglePinPerson,
    re_saveDeal, re_deleteDeal, re_updateDealStatus,
    re_saveProperty, re_deleteProperty,
    re_saveCommission, re_savePayout, re_savePeoplePayment,
  };
}

export function re_calcDocScore(checklist: Record<string, string>): number {
  const vals = Object.values(checklist);
  if (vals.length === 0) return 0;
  const done = vals.filter(v => v === 'Received' || v === 'Verified').length;
  return Math.round((done / vals.length) * 100);
}

export function re_getMonthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function re_isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}
