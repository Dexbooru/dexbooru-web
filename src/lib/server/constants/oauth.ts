import { APP_URL } from '$env/static/private';

export const CALLBACK_ENDPOINT = `${APP_URL}/oauth/callback`;
export const OAUTH_STATE_EXPIRY_SECONDS = 45;
