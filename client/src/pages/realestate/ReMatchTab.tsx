// ═══════════════════════════════════════
// AadanaTharakar — Buyer ↔ Property Match
// ═══════════════════════════════════════
import React, { useState, useMemo } from 'react';
import {
  Users, Building2, MapPin, Phone, MessageCircle,
  Zap, ChevronRight, SlidersHorizontal, Search, ExternalLink,
  Target, TrendingUp, Star, ArrowLeftRight
} from 'lucide-react';
import { TN_DISTRICTS, RE_PROPERTY_TYPES, type RePerson, type ReProperty } from './re-types';
import { ReBadge, ReSearchInput, ReSelect, reInputClass } from './re-ui';
import { formatINR } from '../../utils/formatters';
import { getWhatsAppLink } from '../../utils/formatters';
import { re_calcDocScore } from './re-hooks';

interface Props {
  people: RePerson[];
  properties: ReProperty[];
}

// ── Scoring ─────────────────────────────
function re_scoreMatch(buyer: RePerson, prop: ReProperty): number {
  let score = 0;

  // District match (biggest weight)
  if (buyer.district && prop.district === buyer.district) score += 40;
  // Area partial match
  if (buyer.area && prop.area.toLowerCase().includes(buyer.area.toLowerCase())) score += 15;
  // Property type match
  if (
    buyer.buyer_property_type &&
    buyer.buyer_property_type !== 'Any' &&
    prop.property_type === buyer.buyer_property_type
  ) score += 25;
  // Budget match
  if (buyer.buyer_budget && prop.price) {
    const budget = Number(buyer.buyer_budget);
    const price = Number(prop.price);
    if (price <= budget) {
      const diff = (budget - price) / budget;
      if (diff <= 0.10) score += 20;       // within 10% under budget – perfect
      else if (diff <= 0.30) score += 12;  // within 30% – good
      else score += 5;                      // affordable but far off
    } else {
      // over budget
      const over = (price - budget) / budget;
      if (over <= 0.10) score += 8;   // 10% over – still consider
      // else 0
    }
  }
  // Prefer available properties
  if (prop.status === 'Available') score += 5;

  return Math.min(100, score);
}

function re_matchLabel(score: number) {
  if (score >= 70) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500' };
  if (score >= 45) return { label: 'Good', color: 'text-amber-400', bg: 'bg-amber-500' };
  if (score >= 20) return { label: 'Partial', color: 'text-blue-400', bg: 'bg-blue-500' };
  return { label: 'Low', color: 'text-gray-500', bg: 'bg-gray-600' };
}

// ── Component ────────────────────────────
export const ReMatchTab: React.FC<Props> = ({ people, properties }) => {
  const [mode, setMode] = useState<'buyer' | 'property'>('buyer');

  // ── Buyer→Property mode filters ─────────
  const [buyerSearch, setBuyerSearch] = useState('');
  const [buyerDistrict, setBuyerDistrict] = useState('');
  const [buyerArea, setBuyerArea] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [reqType, setReqType] = useState('');
  const [minScore, setMinScore] = useState(20);
  const [selectedBuyer, setSelectedBuyer] = useState<RePerson | null>(null);

  // ── Property→Buyer mode filters ─────────
  const [propSearch, setPropSearch] = useState('');
  const [propDistrict, setPropDistrict] = useState('');
  const [propArea, setPropArea] = useState('');
  const [propType, setPropType] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedProp, setSelectedProp] = useState<ReProperty | null>(null);

  // ── Dynamic Area Lists ───────────────────
  const buyerAvailableAreas = useMemo(() => {
    const buyersInDistrict = people.filter(p => 
      p.person_type === 'Buyer' && 
      (buyerDistrict ? p.district === buyerDistrict : true)
    );
    const areas = new Set(buyersInDistrict.map(p => p.area?.trim()).filter(Boolean));
    return Array.from(areas).sort();
  }, [people, buyerDistrict]);

  const propAvailableAreas = useMemo(() => {
    const propsInDistrict = properties.filter(p => 
      propDistrict ? p.district === propDistrict : true
    );
    const areas = new Set(propsInDistrict.map(p => p.area?.trim()).filter(Boolean));
    return Array.from(areas).sort();
  }, [properties, propDistrict]);

  // ── Filtered buyers ──────────────────────
  const buyers = useMemo(
    () =>
      people.filter((p) => {
        if (p.person_type !== 'Buyer') return false;
        if (buyerSearch && !p.name.toLowerCase().includes(buyerSearch.toLowerCase()) && !p.mobile.includes(buyerSearch)) return false;
        if (buyerDistrict && p.district !== buyerDistrict) return false;
        if (buyerArea && p.area && !p.area.toLowerCase().includes(buyerArea.toLowerCase())) return false;
        if (reqType && p.buyer_property_type !== reqType && p.buyer_property_type !== 'Any') return false;
        if (budgetMin && Number(p.buyer_budget) < Number(budgetMin)) return false;
        if (budgetMax && Number(p.buyer_budget) > Number(budgetMax)) return false;
        return true;
      }),
    [people, buyerSearch, buyerDistrict, buyerArea, reqType, budgetMin, budgetMax]
  );

  // ── Filtered properties ──────────────────
  const filteredProps = useMemo(
    () =>
      properties.filter((p) => {
        if (propSearch && !p.title.toLowerCase().includes(propSearch.toLowerCase()) && !p.district.toLowerCase().includes(propSearch.toLowerCase())) return false;
        if (propDistrict && p.district !== propDistrict) return false;
        if (propArea && p.area && !p.area.toLowerCase().includes(propArea.toLowerCase())) return false;
        if (propType && p.property_type !== propType) return false;
        if (priceMin && Number(p.price) < Number(priceMin)) return false;
        if (priceMax && Number(p.price) > Number(priceMax)) return false;
        return true;
      }),
    [properties, propSearch, propDistrict, propArea, propType, priceMin, priceMax]
  );

  // ── Matches for selected buyer ───────────
  const buyerMatches = useMemo(() => {
    if (!selectedBuyer) return [];
    return properties
      .filter((p) => p.status === 'Available' || p.status === 'Under Deal')
      .map((prop) => ({ prop, score: re_scoreMatch(selectedBuyer, prop) }))
      .filter((m) => m.score >= minScore)
      .sort((a, b) => b.score - a.score);
  }, [selectedBuyer, properties, minScore]);

  // ── Buyers interested in selected property ──
  const propBuyerMatches = useMemo(() => {
    if (!selectedProp) return [];
    return people
      .filter((p) => p.person_type === 'Buyer' && p.status === 'Active')
      .map((buyer) => ({ buyer, score: re_scoreMatch(buyer, selectedProp) }))
      .filter((m) => m.score >= 20)
      .sort((a, b) => b.score - a.score);
  }, [selectedProp, people]);

  // ── Stats ────────────────────────────────
  const totalBuyers = people.filter((p) => p.person_type === 'Buyer' && p.status === 'Active').length;
  const totalAvail = properties.filter((p) => p.status === 'Available').length;
  const avgBudget =
    people.filter((p) => p.person_type === 'Buyer' && p.buyer_budget).reduce((s, p) => s + Number(p.buyer_budget || 0), 0) /
    (people.filter((p) => p.person_type === 'Buyer' && p.buyer_budget).length || 1);

  return (
    <div className="space-y-5">
      {/* ── Hero Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Users size={18} />, label: 'Active Buyers', val: totalBuyers, color: 'text-blue-400' },
          { icon: <Building2 size={18} />, label: 'Available Properties', val: totalAvail, color: 'text-brand-re' },
          { icon: <Target size={18} />, label: 'Avg Buyer Budget', val: formatINR(avgBudget), color: 'text-emerald-400' },
          { icon: <Zap size={18} />, label: 'Districts Covered', val: new Set(people.filter(p => p.person_type === 'Buyer').map(p => p.district).filter(Boolean)).size, color: 'text-amber-400' },
        ].map(({ icon, label, val, color }) => (
          <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-4 flex items-start gap-3">
            <span className={`mt-0.5 ${color}`}>{icon}</span>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-xl font-heading font-bold ${color}`}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mode Toggle ── */}
      <div className="flex items-center gap-3">
        <div className="flex bg-brand-dark rounded-xl p-1">
          <button
            onClick={() => { setMode('buyer'); setSelectedBuyer(null); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${mode === 'buyer' ? 'bg-brand-re text-white shadow-lg shadow-brand-re/30' : 'text-gray-400 hover:text-white'}`}
          >
            <Users size={14} /> Find Properties for a Buyer
          </button>
          <button
            onClick={() => { setMode('property'); setSelectedProp(null); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${mode === 'property' ? 'bg-brand-re text-white shadow-lg shadow-brand-re/30' : 'text-gray-400 hover:text-white'}`}
          >
            <Building2 size={14} /> Find Buyers for a Property
          </button>
        </div>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <ArrowLeftRight size={12} /> Switch to see matches from either side
        </span>
      </div>

      {/* ══════════════════════════════════════════
          MODE A: Buyer → Property
      ══════════════════════════════════════════ */}
      {mode === 'buyer' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* LEFT: Buyer list with filters */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} /> Filter Buyers
              </p>
              <ReSearchInput value={buyerSearch} onChange={setBuyerSearch} placeholder="Search buyer by name / mobile..." />
              <div className="grid grid-cols-2 gap-2">
                <ReSelect value={buyerDistrict} onChange={setBuyerDistrict} options={TN_DISTRICTS} allLabel="Any District" />
                <ReSelect 
                  value={buyerArea} 
                  onChange={setBuyerArea} 
                  options={buyerAvailableAreas} 
                  allLabel="Any Area" 
                />
              </div>
              <ReSelect value={reqType} onChange={setReqType} options={[...RE_PROPERTY_TYPES]} allLabel="Any Property Type" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Budget Min (₹)</label>
                  <input
                    className={reInputClass + ' text-xs'}
                    type="number"
                    placeholder="e.g. 1000000"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Budget Max (₹)</label>
                  <input
                    className={reInputClass + ' text-xs'}
                    type="number"
                    placeholder="e.g. 5000000"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Buyer cards */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-0.5">
              {buyers.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-gray-600">
                  <Users size={32} className="mb-3 opacity-40" />
                  <p className="text-sm">No buyers match your filters</p>
                  <p className="text-xs mt-1 text-gray-700">Add buyers via People & Network tab</p>
                </div>
              ) : (
                buyers.map((buyer) => (
                  <button
                    key={buyer.id}
                    onClick={() => setSelectedBuyer(buyer)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selectedBuyer?.id === buyer.id
                        ? 'bg-brand-re/10 border-brand-re/50 shadow-[0_0_14px_rgba(255,107,107,0.1)]'
                        : 'bg-brand-card border-brand-border hover:border-brand-re/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{buyer.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{buyer.mobile}</p>
                      </div>
                      <ReBadge label={buyer.status} />
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      {buyer.buyer_budget && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-gray-500">Budget:</span>
                          <span className="text-emerald-400 font-semibold">{formatINR(buyer.buyer_budget)}</span>
                        </div>
                      )}
                      {buyer.district && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <MapPin size={11} className="text-brand-re shrink-0" />
                          {buyer.district}{buyer.area ? `, ${buyer.area}` : ''}
                        </div>
                      )}
                      {buyer.buyer_property_type && buyer.buyer_property_type !== 'Any' && (
                        <div className="text-xs text-blue-400">
                          Wants: {buyer.buyer_property_type}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-600">
                      <Zap size={10} />
                      {(() => {
                        const cnt = properties
                          .filter(p => p.status === 'Available')
                          .map(p => re_scoreMatch(buyer, p))
                          .filter(s => s >= 20).length;
                        return <span>{cnt} potential match{cnt !== 1 ? 'es' : ''}</span>;
                      })()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Matched properties */}
          <div className="lg:col-span-3">
            {!selectedBuyer ? (
              <div className="bg-brand-card border border-brand-border rounded-2xl flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-brand-re/10 border border-brand-re/20 flex items-center justify-center">
                  <Target size={28} className="text-brand-re" />
                </div>
                <p className="text-white font-heading font-bold">Select a Buyer</p>
                <p className="text-sm text-gray-500 max-w-xs">
                  Click on any buyer on the left to see which available properties best match their budget, preferred district, and property type.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Buyer summary header */}
                <div className="bg-gradient-to-r from-brand-re/10 to-transparent border border-brand-re/20 rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-heading font-bold text-white text-base">{selectedBuyer.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Buyer Profile</p>
                    </div>
                    <div className="flex gap-2">
                      <a href={getWhatsAppLink(selectedBuyer.mobile)} target="_blank" rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                        <MessageCircle size={15} />
                      </a>
                      <a href={`tel:${selectedBuyer.mobile}`}
                        className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                        <Phone size={15} />
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-brand-dark/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-gray-500 mb-0.5">Budget</p>
                      <p className="text-sm font-bold text-emerald-400">{selectedBuyer.buyer_budget ? formatINR(selectedBuyer.buyer_budget) : 'Open'}</p>
                    </div>
                    <div className="bg-brand-dark/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-gray-500 mb-0.5">Preferred District</p>
                      <p className="text-sm font-bold text-white truncate">{selectedBuyer.district || 'Any'}</p>
                    </div>
                    <div className="bg-brand-dark/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-gray-500 mb-0.5">Property Type</p>
                      <p className="text-sm font-bold text-blue-400 truncate">{selectedBuyer.buyer_property_type || 'Any'}</p>
                    </div>
                  </div>
                </div>

                {/* Min score slider */}
                <div className="flex items-center gap-3 px-1">
                  <span className="text-xs text-gray-500 whitespace-nowrap">Min match score:</span>
                  <input
                    type="range" min={0} max={80} step={5} value={minScore}
                    onChange={e => setMinScore(+e.target.value)}
                    className="flex-1 accent-brand-re"
                  />
                  <span className="text-xs font-semibold text-brand-re w-10 text-right">{minScore}%+</span>
                </div>

                {/* Match count */}
                <p className="text-xs text-gray-500 px-1">
                  Found <span className="text-white font-semibold">{buyerMatches.length}</span> matching propert{buyerMatches.length !== 1 ? 'ies' : 'y'}
                </p>

                {/* Property match cards */}
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
                  {buyerMatches.length === 0 ? (
                    <div className="bg-brand-card border border-brand-border rounded-2xl flex flex-col items-center py-12 text-gray-600">
                      <Building2 size={32} className="mb-3 opacity-40" />
                      <p className="text-sm">No properties matched</p>
                      <p className="text-xs mt-1 text-gray-700">Lower the min score or adjust buyer preferences</p>
                    </div>
                  ) : (
                    buyerMatches.map(({ prop, score }) => {
                      const { label, color, bg } = re_matchLabel(score);
                      const overBudget = selectedBuyer.buyer_budget && Number(prop.price) > Number(selectedBuyer.buyer_budget);
                      const docScore = re_calcDocScore(
                        typeof prop.doc_checklist === 'string'
                          ? JSON.parse(prop.doc_checklist || '{}')
                          : (prop.doc_checklist || {})
                      );
                      return (
                        <div key={prop.id}
                          className="bg-brand-card border border-brand-border rounded-2xl p-4 hover:border-brand-re/30 transition-all">
                          <div className="flex items-start gap-3">
                            {/* Score ring */}
                            <div className="shrink-0 flex flex-col items-center gap-1">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-heading font-bold border ${
                                score >= 70 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : score >= 45 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              }`}>
                                {score}
                              </div>
                              <span className={`text-[10px] font-semibold ${color}`}>{label}</span>
                            </div>
                            {/* Property info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-white text-sm truncate">{prop.title}</p>
                                <ReBadge label={prop.status} />
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400">
                                <span className="flex items-center gap-1"><MapPin size={11} className="text-brand-re" />{prop.district}{prop.area ? `, ${prop.area}` : ''}</span>
                                <span>{prop.property_type}</span>
                                {prop.extent && <span>📐 {prop.extent}</span>}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div>
                                  <span className={`text-base font-heading font-bold ${overBudget ? 'text-orange-400' : 'text-brand-re'}`}>
                                    {formatINR(prop.price)}
                                  </span>
                                  {overBudget && (
                                    <span className="text-[10px] text-orange-400 ml-2">
                                      +{formatINR(Number(prop.price) - Number(selectedBuyer.buyer_budget))} over budget
                                    </span>
                                  )}
                                  {!overBudget && selectedBuyer.buyer_budget && (
                                    <span className="text-[10px] text-emerald-400 ml-2">
                                      {formatINR(Number(selectedBuyer.buyer_budget) - Number(prop.price))} under budget ✓
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                  <span>Docs: <span className={docScore >= 80 ? 'text-emerald-400' : docScore >= 50 ? 'text-amber-400' : 'text-red-400'}>{docScore}%</span></span>
                                  {prop.maps_link && (
                                    <a href={prop.maps_link} target="_blank" rel="noreferrer"
                                      className="flex items-center gap-1 text-blue-400 hover:underline"
                                      onClick={e => e.stopPropagation()}>
                                      <MapPin size={11} /> Map
                                    </a>
                                  )}
                                </div>
                              </div>
                              {/* Match breakdown */}
                              <div className="mt-2 w-full h-1.5 bg-brand-dark rounded-full overflow-hidden">
                                <div className={`h-full ${bg} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODE B: Property → Buyers
      ══════════════════════════════════════════ */}
      {mode === 'property' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* LEFT: Property list with filters */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal size={13} /> Filter Properties
              </p>
              <ReSearchInput value={propSearch} onChange={setPropSearch} placeholder="Search by title or district..." />
              <div className="grid grid-cols-2 gap-2">
                <ReSelect value={propDistrict} onChange={setPropDistrict} options={TN_DISTRICTS} allLabel="Any District" />
                <ReSelect 
                  value={propArea} 
                  onChange={setPropArea} 
                  options={propAvailableAreas} 
                  allLabel="Any Area" 
                />
              </div>
              <ReSelect value={propType} onChange={setPropType} options={[...RE_PROPERTY_TYPES]} allLabel="Any Property Type" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Price Min (₹)</label>
                  <input className={reInputClass + ' text-xs'} type="number" placeholder="e.g. 1000000" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Price Max (₹)</label>
                  <input className={reInputClass + ' text-xs'} type="number" placeholder="e.g. 10000000" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Property cards */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-0.5">
              {filteredProps.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-gray-600">
                  <Building2 size={32} className="mb-3 opacity-40" />
                  <p className="text-sm">No properties match your filters</p>
                </div>
              ) : (
                filteredProps.map((prop) => {
                  const interestedCount = people
                    .filter(p => p.person_type === 'Buyer' && p.status === 'Active')
                    .map(b => re_scoreMatch(b, prop))
                    .filter(s => s >= 20).length;
                  return (
                    <button
                      key={prop.id}
                      onClick={() => setSelectedProp(prop)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        selectedProp?.id === prop.id
                          ? 'bg-brand-re/10 border-brand-re/50 shadow-[0_0_14px_rgba(255,107,107,0.1)]'
                          : 'bg-brand-card border-brand-border hover:border-brand-re/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-white text-sm truncate flex-1">{prop.title}</p>
                        <ReBadge label={prop.status} />
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <MapPin size={11} className="text-brand-re shrink-0" />{prop.district}{prop.area ? `, ${prop.area}` : ''}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-brand-re font-bold">{formatINR(prop.price)}</span>
                          <span className="text-gray-500">{prop.property_type}</span>
                        </div>
                        {prop.extent && <div className="text-xs text-gray-500">📐 {prop.extent}</div>}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-600">
                        <Users size={10} />
                        <span>{interestedCount} potential buyer{interestedCount !== 1 ? 's' : ''}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Matched buyers */}
          <div className="lg:col-span-3">
            {!selectedProp ? (
              <div className="bg-brand-card border border-brand-border rounded-2xl flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-brand-re/10 border border-brand-re/20 flex items-center justify-center">
                  <Users size={28} className="text-brand-re" />
                </div>
                <p className="text-white font-heading font-bold">Select a Property</p>
                <p className="text-sm text-gray-500 max-w-xs">
                  Click on any property on the left to see which active buyers in your network are a good match based on their budget, preferred district and property type.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Property summary header */}
                <div className="bg-gradient-to-r from-brand-re/10 to-transparent border border-brand-re/20 rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-white text-base truncate">{selectedProp.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{selectedProp.property_type}</p>
                    </div>
                    {selectedProp.maps_link && (
                      <a href={selectedProp.maps_link} target="_blank" rel="noreferrer"
                        className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-brand-dark/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-gray-500 mb-0.5">Price</p>
                      <p className="text-sm font-bold text-brand-re">{formatINR(selectedProp.price)}</p>
                    </div>
                    <div className="bg-brand-dark/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-gray-500 mb-0.5">Location</p>
                      <p className="text-sm font-bold text-white truncate">{selectedProp.district}</p>
                    </div>
                    <div className="bg-brand-dark/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-gray-500 mb-0.5">Extent</p>
                      <p className="text-sm font-bold text-amber-400 truncate">{selectedProp.extent || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Match count */}
                <p className="text-xs text-gray-500 px-1">
                  Found <span className="text-white font-semibold">{propBuyerMatches.length}</span> interested buyer{propBuyerMatches.length !== 1 ? 's' : ''}
                </p>

                {/* Buyer match cards */}
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
                  {propBuyerMatches.length === 0 ? (
                    <div className="bg-brand-card border border-brand-border rounded-2xl flex flex-col items-center py-12 text-gray-600">
                      <Users size={32} className="mb-3 opacity-40" />
                      <p className="text-sm">No matching buyers found</p>
                      <p className="text-xs mt-1 text-gray-700">Add more buyers with budget &amp; location preferences</p>
                    </div>
                  ) : (
                    propBuyerMatches.map(({ buyer, score }) => {
                      const { label, color, bg } = re_matchLabel(score);
                      const canAfford = buyer.buyer_budget && Number(buyer.buyer_budget) >= Number(selectedProp.price);
                      const shortfall = buyer.buyer_budget ? Number(selectedProp.price) - Number(buyer.buyer_budget) : 0;
                      return (
                        <div key={buyer.id} className="bg-brand-card border border-brand-border rounded-2xl p-4 hover:border-brand-re/30 transition-all">
                          <div className="flex items-start gap-3">
                            {/* Score box */}
                            <div className="shrink-0 flex flex-col items-center gap-1">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-heading font-bold border ${
                                score >= 70 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : score >= 45 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              }`}>
                                {score}
                              </div>
                              <span className={`text-[10px] font-semibold ${color}`}>{label}</span>
                            </div>
                            {/* Buyer info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-white text-sm">{buyer.name}</p>
                                <div className="flex gap-1.5 shrink-0">
                                  <a href={getWhatsAppLink(buyer.mobile)} target="_blank" rel="noreferrer"
                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                    onClick={e => e.stopPropagation()}>
                                    <MessageCircle size={13} />
                                  </a>
                                  <a href={`tel:${buyer.mobile}`}
                                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                    onClick={e => e.stopPropagation()}>
                                    <Phone size={13} />
                                  </a>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{buyer.mobile}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                                {buyer.buyer_budget && (
                                  <span className="flex items-center gap-1 text-gray-400">
                                    Budget: <span className={canAfford ? 'text-emerald-400 font-semibold' : 'text-orange-400 font-semibold'}>{formatINR(buyer.buyer_budget)}</span>
                                    {canAfford
                                      ? <span className="text-emerald-500">✓ Can afford</span>
                                      : shortfall > 0 ? <span className="text-orange-400">({formatINR(shortfall)} short)</span> : null
                                    }
                                  </span>
                                )}
                                {buyer.district && (
                                  <span className="flex items-center gap-1 text-gray-400">
                                    <MapPin size={10} className="text-brand-re" />{buyer.district}
                                  </span>
                                )}
                              </div>
                              {buyer.buyer_property_type && buyer.buyer_property_type !== 'Any' && (
                                <div className="text-[10px] text-blue-400 mt-1">Wants: {buyer.buyer_property_type}</div>
                              )}
                              {buyer.notes && (
                                <div className="text-[10px] text-gray-500 mt-1 truncate">📝 {buyer.notes}</div>
                              )}
                              <div className="mt-2 w-full h-1.5 bg-brand-dark rounded-full overflow-hidden">
                                <div className={`h-full ${bg} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
