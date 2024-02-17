import { dev } from '$app/environment';

const URL_PROTOCOL = dev ? 'http' : 'https';
export const APP_BASE_URL = `${URL_PROTOCOL}://${import.meta.env.VITE_VERCEL_URL}`;
