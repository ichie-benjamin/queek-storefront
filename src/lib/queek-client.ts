import { createQueekClient } from '@queekai/client-sdk';

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/+$/, '');

export const queekClient = createQueekClient({ baseUrl });
