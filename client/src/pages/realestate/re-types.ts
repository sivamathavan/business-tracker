// ═══════════════════════════════════════
// AadanaTharakar — Types & Constants
// ═══════════════════════════════════════

export const RE_TABS = [
  { key: 'overview', label: 'Overview', icon: '🏠' },
  { key: 'people', label: 'People & Network', icon: '👥' },
  { key: 'deals', label: 'Deals', icon: '🤝' },
  { key: 'properties', label: 'Properties', icon: '🏘' },
  { key: 'commission', label: 'Commission', icon: '💰' },
  { key: 'analytics', label: 'Analytics', icon: '📊' },
] as const;

export type ReTabKey = (typeof RE_TABS)[number]['key'];

export const RE_PERSON_TYPES = [
  'Buyer', 'Broker', 'Land Owner', 'Builder', 'Interior Designer',
  'Architect', 'Lawyer', 'Financial Agent', 'Other',
] as const;
export type RePersonType = (typeof RE_PERSON_TYPES)[number];

export const RE_DEAL_TYPES = [
  'Both Side Broker', 'Buyer Side Only', 'Seller Side Only',
  'Direct Deal', 'Chain Broker', 'Referral',
] as const;
export type ReDealType = (typeof RE_DEAL_TYPES)[number];

export const RE_DEAL_STATUSES = [
  'New Lead', 'Site Visit Done', 'Negotiation', 'Token Paid',
  'Agreement Signed', 'Registration Done', 'Completed', 'Dropped',
] as const;
export type ReDealStatus = (typeof RE_DEAL_STATUSES)[number];

export const RE_PROPERTY_TYPES = [
  'Residential Plot', 'Agricultural Land', 'Commercial Plot',
  'Apartment', 'Villa', 'Industrial', 'Other',
] as const;
export type RePropertyType = (typeof RE_PROPERTY_TYPES)[number];

export const RE_PROPERTY_STATUSES = ['Available', 'Under Deal', 'Sold', 'Off Market'] as const;
export type RePropertyStatus = (typeof RE_PROPERTY_STATUSES)[number];

export const RE_SUBMITTER_TYPES = ['Broker', 'Owner Direct', 'Builder', 'Self Found'] as const;

export const RE_DOC_ITEMS = [
  'Patta', 'Chitta', 'FMB Sketch', 'EC (Encumbrance)',
  'Sale Deed', 'Parent Document', 'Tax Receipt', 'Survey Sketch', 'Aadhaar / ID Proof',
] as const;

export const RE_COMMISSION_PILLS = [
  'Calculator', 'Deal Records', 'People Commission', 'Payouts', 'Net Summary',
] as const;
export type ReCommPill = (typeof RE_COMMISSION_PILLS)[number];

export const TN_DISTRICTS = [
  'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore',
  'Dharmapuri','Dindigul','Erode','Kallakurichi','Kancheepuram',
  'Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam',
  'Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram',
  'Ranipet','Salem','Sivagangai','Tenkasi','Thanjavur',
  'Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur',
  'Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore',
  'Viluppuram','Virudhunagar','Kanniyakumari',
] as const;

// ── Interfaces ──────────────────────────

export interface RePerson {
  id: string;
  name: string;
  person_type: RePersonType;
  mobile: string;
  email: string;
  district: string;
  area: string;
  company: string;
  rera_id: string;
  commission_giver: boolean;
  commission_rate: number;
  total_commission: number;
  status: 'Active' | 'Inactive';
  pinned: boolean;
  notes: string;
  specialization: string;
  buyer_budget?: number;
  buyer_property_type?: RePropertyType | 'Any';
  created_at: string;
}

export interface ReDeal {
  id: string;
  title: string;
  deal_type: ReDealType;
  status: ReDealStatus;
  property_type: RePropertyType;
  district: string;
  area: string;
  property_value: number;
  seller_name: string;
  seller_mobile: string;
  buyer_name: string;
  buyer_mobile: string;
  seller_broker_id: string;
  buyer_broker_id: string;
  commission_rate_seller: number;
  commission_rate_buyer: number;
  commission_amount: number;
  commission_received: number;
  token_amount: number;
  follow_up_date: string;
  notes: string;
  documents: string[];
  created_at: string;
}

export interface ReProperty {
  id: string;
  title: string;
  property_type: RePropertyType;
  status: RePropertyStatus;
  district: string;
  area: string;
  extent: string;
  road_facing: string;
  price: number;
  price_per_unit: string;
  submitter_type: string;
  submitter_name: string;
  submitter_mobile: string;
  owner_name: string;
  owner_mobile: string;
  survey_number: string;
  maps_link: string;
  doc_checklist: Record<string, 'Pending' | 'Received' | 'Verified'>;
  photos: string[];
  notes: string;
  created_at: string;
}

export interface ReCommissionRecord {
  id: string;
  deal_id: string;
  deal_title: string;
  deal_type: ReDealType;
  total_value: number;
  commission_expected: number;
  commission_received: number;
  payout_amount: number;
  status: 'Pending' | 'Partial' | 'Completed';
  date: string;
}

export interface RePayout {
  id: string;
  person_id: string;
  person_name: string;
  deal_id: string;
  deal_title: string;
  amount: number;
  paid: boolean;
  date: string;
  notes: string;
}

export interface RePeoplePayment {
  id: string;
  person_id: string;
  person_name: string;
  deal_id: string;
  deal_title: string;
  amount: number;
  received: boolean;
  date: string;
  notes: string;
}

export interface ReActivity {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  timestamp: string;
}

// ── localStorage Keys ───────────────────

export const LS = {
  people: 're_people',
  deals: 're_deals',
  properties: 're_properties',
  commissions: 're_commissions',
  payouts: 're_payouts',
  people_payments: 're_people_payments',
  activity: 're_activity',
} as const;

// ── Helper ──────────────────────────────

export function re_id(): string {
  return `re_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Seed Data ───────────────────────────

export const SEED_PEOPLE: RePerson[] = [
  { id: re_id(), name: 'Karthik Selvam', person_type: 'Broker', mobile: '9876543210', email: 'karthik@mail.com', district: 'Madurai', area: 'Thirumangalam', company: 'SK Realty', rera_id: 'TN-RE-0012', commission_giver: true, commission_rate: 1.5, total_commission: 225000, status: 'Active', pinned: true, notes: 'Top performer Q1', specialization: 'Agricultural Land', created_at: new Date().toISOString() },
  { id: re_id(), name: 'Priya Devi', person_type: 'Broker', mobile: '9871234567', email: 'priya@mail.com', district: 'Coimbatore', area: 'RS Puram', company: 'Priya Properties', rera_id: 'TN-RE-0034', commission_giver: true, commission_rate: 2.0, total_commission: 180000, status: 'Active', pinned: false, notes: '', specialization: 'Residential Plot', created_at: new Date().toISOString() },
  { id: re_id(), name: 'Rajan Murugan', person_type: 'Land Owner', mobile: '9865432100', email: 'rajan@mail.com', district: 'Salem', area: 'Attur', company: '', rera_id: '', commission_giver: false, commission_rate: 0, total_commission: 0, status: 'Active', pinned: false, notes: 'Owns 10 acres at Attur', specialization: '', created_at: new Date().toISOString() },
  { id: re_id(), name: 'Vijay Kumar', person_type: 'Builder', mobile: '9843211234', email: 'vijay@build.com', district: 'Tiruchirappalli', area: 'Srirangam', company: 'VK Constructions', rera_id: 'TN-BLD-0088', commission_giver: true, commission_rate: 1.0, total_commission: 95000, status: 'Active', pinned: false, notes: '', specialization: 'Villa', created_at: new Date().toISOString() },
  { id: re_id(), name: 'Meena Lakshmi', person_type: 'Interior Designer', mobile: '9898765432', email: 'meena@design.com', district: 'Madurai', area: 'KK Nagar', company: 'Meena Interiors', rera_id: '', commission_giver: false, commission_rate: 0, total_commission: 0, status: 'Active', pinned: false, notes: 'Specializes in modular kitchen', specialization: 'Modular Kitchen', created_at: new Date().toISOString() },
  { id: re_id(), name: 'Advocate Senthil', person_type: 'Lawyer', mobile: '9812345678', email: 'senthil@law.com', district: 'Coimbatore', area: 'Town Hall', company: 'Senthil & Associates', rera_id: '', commission_giver: false, commission_rate: 0, total_commission: 0, status: 'Active', pinned: false, notes: 'Property documentation expert', specialization: 'Property Law', created_at: new Date().toISOString() },
];

export function re_getSeedProperties(): ReProperty[] {
  return [
    { id: re_id(), title: '3 Acres NH Facing Land', property_type: 'Agricultural Land', status: 'Available', district: 'Madurai', area: 'Thirumangalam', extent: '3 Acres', road_facing: '60 ft NH', price: 4500000, price_per_unit: '₹15L/acre', submitter_type: 'Broker', submitter_name: 'Karthik Selvam', submitter_mobile: '9876543210', owner_name: 'Rajan M', owner_mobile: '9865432100', survey_number: '145/2A', maps_link: '', doc_checklist: { 'Patta': 'Verified', 'Chitta': 'Verified', 'FMB Sketch': 'Received', 'EC (Encumbrance)': 'Received', 'Sale Deed': 'Pending', 'Parent Document': 'Received', 'Tax Receipt': 'Verified', 'Survey Sketch': 'Pending', 'Aadhaar / ID Proof': 'Verified' }, photos: [], notes: 'NH-44 side, good frontage', created_at: new Date().toISOString() },
    { id: re_id(), title: '1.5 Acres Attur Land', property_type: 'Agricultural Land', status: 'Under Deal', district: 'Salem', area: 'Attur', extent: '1.5 Acres', road_facing: '30 ft', price: 1800000, price_per_unit: '₹12L/acre', submitter_type: 'Owner Direct', submitter_name: 'Rajan Murugan', submitter_mobile: '9865432100', owner_name: 'Rajan Murugan', owner_mobile: '9865432100', survey_number: '89/1B', maps_link: '', doc_checklist: { 'Patta': 'Verified', 'Chitta': 'Received', 'FMB Sketch': 'Pending', 'EC (Encumbrance)': 'Pending', 'Sale Deed': 'Pending', 'Parent Document': 'Pending', 'Tax Receipt': 'Received', 'Survey Sketch': 'Pending', 'Aadhaar / ID Proof': 'Received' }, photos: [], notes: '', created_at: new Date().toISOString() },
    { id: re_id(), title: 'Commercial Plot RS Puram', property_type: 'Commercial Plot', status: 'Available', district: 'Coimbatore', area: 'RS Puram', extent: '2400 sqft', road_facing: '40 ft', price: 7200000, price_per_unit: '₹3000/sqft', submitter_type: 'Broker', submitter_name: 'Priya Devi', submitter_mobile: '9871234567', owner_name: 'Suresh R', owner_mobile: '9845678901', survey_number: '23/4C', maps_link: '', doc_checklist: { 'Patta': 'Verified', 'Chitta': 'Verified', 'FMB Sketch': 'Verified', 'EC (Encumbrance)': 'Verified', 'Sale Deed': 'Received', 'Parent Document': 'Received', 'Tax Receipt': 'Verified', 'Survey Sketch': 'Verified', 'Aadhaar / ID Proof': 'Verified' }, photos: [], notes: 'Prime location', created_at: new Date().toISOString() },
  ];
}

export function re_getSeedDeals(): ReDeal[] {
  return [
    { id: re_id(), title: 'Thirumangalam 3 Acre Deal', deal_type: 'Both Side Broker', status: 'Negotiation', property_type: 'Agricultural Land', district: 'Madurai', area: 'Thirumangalam', property_value: 4500000, seller_name: 'Rajan M', seller_mobile: '9865432100', buyer_name: 'Ganesh P', buyer_mobile: '9856781234', seller_broker_id: '', buyer_broker_id: '', commission_rate_seller: 1.5, commission_rate_buyer: 1.0, commission_amount: 112500, commission_received: 0, token_amount: 0, follow_up_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), notes: 'Both sides through us', documents: [], created_at: new Date().toISOString() },
    { id: re_id(), title: 'RS Puram Commercial Sale', deal_type: 'Buyer Side Only', status: 'Completed', property_type: 'Commercial Plot', district: 'Coimbatore', area: 'RS Puram', property_value: 7200000, seller_name: 'Suresh R', seller_mobile: '9845678901', buyer_name: 'Mohan K', buyer_mobile: '9834561234', seller_broker_id: '', buyer_broker_id: '', commission_rate_seller: 0, commission_rate_buyer: 2.0, commission_amount: 144000, commission_received: 144000, token_amount: 500000, follow_up_date: '', notes: 'Completed successfully', documents: [], created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
    { id: re_id(), title: 'Attur Land Direct', deal_type: 'Direct Deal', status: 'Token Paid', property_type: 'Agricultural Land', district: 'Salem', area: 'Attur', property_value: 1800000, seller_name: 'Rajan Murugan', seller_mobile: '9865432100', buyer_name: 'Arun S', buyer_mobile: '9823456789', seller_broker_id: '', buyer_broker_id: '', commission_rate_seller: 1.0, commission_rate_buyer: 0, commission_amount: 18000, commission_received: 9000, token_amount: 200000, follow_up_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), notes: 'Token collected', documents: [], created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  ];
}

export function re_getSeedCommissions(): ReCommissionRecord[] {
  return [
    { id: re_id(), deal_id: '', deal_title: 'RS Puram Commercial Sale', deal_type: 'Buyer Side Only', total_value: 7200000, commission_expected: 144000, commission_received: 144000, payout_amount: 0, status: 'Completed', date: new Date(Date.now() - 30 * 86400000).toISOString() },
    { id: re_id(), deal_id: '', deal_title: 'Attur Land Direct', deal_type: 'Direct Deal', total_value: 1800000, commission_expected: 18000, commission_received: 9000, payout_amount: 0, status: 'Partial', date: new Date(Date.now() - 10 * 86400000).toISOString() },
  ];
}
