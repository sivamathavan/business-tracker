import { format, parseISO, isValid } from 'date-fns';

/**
 * Formats a number to Indian Rupee currency format (e.g. ₹1,23,456)
 */
export const formatINR = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '₹0';
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Formats a Date object or ISO date string to DD MMM YYYY (e.g. 28 May 2026)
 */
export const formatDateStr = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  let parsedDate: Date;
  if (typeof date === 'string') {
    parsedDate = parseISO(date);
  } else {
    parsedDate = date;
  }

  if (!isValid(parsedDate)) return '-';
  return format(parsedDate, 'dd MMM yyyy');
};

/**
 * Cleans a mobile number keeping only digits
 */
export const cleanMobileStr = (num: string | null | undefined): string => {
  if (!num) return '';
  return num.replace(/\D/g, '');
};

/**
 * Formats a cleaned mobile number string to: +91 XXXXX XXXXX
 */
export const formatMobileStr = (num: string | null | undefined): string => {
  if (!num) return '-';
  const cleaned = cleanMobileStr(num);
  
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  
  return num; // Fallback to raw format if it doesn't match standard lengths
};

/**
 * Generates a wa.me/91XXXXXXXXXX WhatsApp link
 */
export const getWhatsAppLink = (num: string | null | undefined): string => {
  if (!num) return '#';
  let cleaned = cleanMobileStr(num);
  
  // If it's a 10 digit Indian number, append the 91 country code prefix
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return `https://wa.me/${cleaned}`;
};
