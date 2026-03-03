export const shopLabel = (name: string | null | undefined, slug: string | null): string => {
  if (name) return name;
  if (!slug) return '';
  return slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
};

export const ratingStr = (rating: number): string =>
  Number.isFinite(rating) ? rating.toFixed(1) : '0.0';

export const reviewCountLabel = (count: number | null | undefined): string | null => {
  const total = Number(count);
  if (!Number.isFinite(total) || total <= 0) return null;
  if (total >= 1000) return `${(total / 1000).toFixed(1)}K`;
  return `${total}`;
};

export const reviewLabel = (count: number | null | undefined): string | null => {
  const total = Number(count);
  if (!Number.isFinite(total) || total <= 0) return null;
  if (total >= 1000) return `${(total / 1000).toFixed(1)}K reviews`;
  return `${total} reviews`;
};

export const descriptionBullets = (raw: string | null): string[] => {
  if (!raw) return [];
  return raw.replace(/\\n/g, '\n').split(/\n|•/).map((s) => s.trim()).filter(Boolean).slice(0, 5);
};

export const relativeDate = (value: string | null): string | null => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const delta = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (delta <= 0) return 'today';
  if (delta === 1) return '1 day ago';
  if (delta < 30) return `${delta} days ago`;
  return d.toLocaleDateString();
};

export const getStoredAddress = (): string => {
  try { return localStorage.getItem('qn-delivery-address') || ''; } catch { return ''; }
};

export const setStoredAddress = (value: string): void => {
  try { localStorage.setItem('qn-delivery-address', value); } catch { /* noop */ }
};
