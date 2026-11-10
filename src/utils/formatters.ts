import { Language } from '../types';

const banglaDigits: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBanglaDigits(num: string | number): string {
  const str = String(num);
  return str.replace(/[0-9]/g, (w) => banglaDigits[w] || w);
}

export function formatCurrency(amount: number, lang: Language = 'bn'): string {
  const val = Number(amount) || 0;
  const formatted = val.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (lang === 'bn') {
    return `৳${toBanglaDigits(formatted)}`;
  }
  return `৳${formatted}`;
}

export function formatDate(dateStr: string, lang: Language = 'bn'): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    // Use Asia/Dhaka options
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Dhaka',
    };

    if (lang === 'bn') {
      const formatted = d.toLocaleDateString('bn-BD', options);
      return formatted;
    }
    return d.toLocaleDateString('en-GB', options);
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Dhaka',
    });
  } catch {
    return dateStr;
  }
}
