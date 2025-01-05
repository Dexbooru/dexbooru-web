import { buildValidUrl } from '$lib/shared/constants/urls';

export const APP_BASE_URL = buildValidUrl(import.meta.env.VITE_APP_URL ?? '');
export const ML_API_URL = buildValidUrl(import.meta.env.VITE_DEXBOORU_ML_API_URL ?? '');
