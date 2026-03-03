import { createQueekClient } from '@queekai/client-sdk';
import { resolveVendorSlug } from './shop-context';

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/+$/, '');
const vendorSlug = resolveVendorSlug();

export const queekClient = createQueekClient({
  baseUrl,
  ...(vendorSlug ? { vendorSlug } : {}),
});
