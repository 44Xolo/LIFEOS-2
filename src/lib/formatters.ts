import type { CurrencyCode } from '../types/lifeos';

const CURRENCY_LOCALE: Record<CurrencyCode, { locale: string; symbol: string }> = {
  ZAR: { locale: 'en-ZA', symbol: 'R' },
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'en-IE', symbol: '€' },
  GBP: { locale: 'en-GB', symbol: '£' },
};

export function formatMoney(amount: number, currency: CurrencyCode = 'ZAR'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const meta = CURRENCY_LOCALE[currency] || CURRENCY_LOCALE.ZAR;
  const formatted = new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(safeAmount));
  const prefix = safeAmount < 0 ? '-' : '';
  return `${prefix}${meta.symbol} ${formatted}`;
}

export function formatCompactMoney(amount: number, currency: CurrencyCode = 'ZAR'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const meta = CURRENCY_LOCALE[currency] || CURRENCY_LOCALE.ZAR;
  if (Math.abs(safeAmount) >= 1000) {
    return `${meta.symbol} ${(safeAmount / 1000).toFixed(1)}k`;
  }
  return `${meta.symbol} ${Math.round(safeAmount)}`;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIsoDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatHumanDate(isoDate: string): string {
  if (!isoDate) return '';
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function clampStr(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function generateDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}
