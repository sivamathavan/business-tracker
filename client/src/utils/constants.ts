export const BUSINESS_OPTIONS = [
  { slug: 'tech',       label: 'Rturox Technology' },
  { slug: 'realestate', label: 'DkProperties' },
  { slug: 'training',   label: 'RturoxAcademy' },
  { slug: 'coaching',   label: 'AchieversNest' },
  { slug: 'general',    label: 'General / All Businesses' }
] as const;

export const EXPENSE_CATEGORIES = [
  'Petrol', 'Rent', 'WiFi', 'Electricity', 'Salary',
  'Food', 'Travel', 'Office Supplies', 'Marketing', 'Software', 'Other'
] as const;

export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Card'] as const;

export const getBizLabel = (slug: string): string =>
  BUSINESS_OPTIONS.find(b => b.slug === slug)?.label ?? slug;
