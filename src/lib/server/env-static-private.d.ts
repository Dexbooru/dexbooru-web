/**
 * Declares private env vars used via `$env/static/private` so `pnpm check` works
 * without a local `.env` (e.g. CI). SvelteKit still inlines real values at build
 * time from `.env` / process env. Add new keys here when importing from that module.
 */
declare module '$env/static/private' {
	export const DOMAIN: string;
	export const DB_REDIS_PASSWORD: string;
	export const DB_REDIS_URL: string;
	export const JWT_PRIVATE_KEY: string;
	export const DEXBOORU_ML_API_URL: string;
	export const AWS_CLOUDFRONT_ENDPOINT: string;
	export const AWS_CLOUDFRONT_CDN_URL: string;
	export const RABBITMQ_URL: string;
	export const APP_URL: string;
	export const OAUTH_DISCORD_CLIENT_ID: string;
	export const OAUTH_DISCORD_CLIENT_SECRET: string;
	export const OAUTH_GITHUB_CLIENT_ID: string;
	export const OAUTH_GITHUB_CLIENT_SECRET: string;
	export const OAUTH_GOOGLE_CLIENT_ID: string;
	export const OAUTH_GOOGLE_CLIENT_SECRET: string;
	export const SMTP_HOST: string;
	export const SMTP_PASSWORD: string;
	export const SMTP_PORT: string;
	export const SMTP_USERNAME: string;
	export const OTP_PRIVATE_KEY: string;
	export const AWS_SQS_POST_CLASSIFICATION_QUEUE_URL: string;
	export const WEBHOOK_SECRET: string;
}
