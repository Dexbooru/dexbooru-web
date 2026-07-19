import { env } from '$env/dynamic/private';

export const APP_URL = env.APP_URL ?? '';
export const AWS_CLOUDFRONT_CDN_URL = env.AWS_CLOUDFRONT_CDN_URL ?? '';
export const AWS_CLOUDFRONT_ENDPOINT = env.AWS_CLOUDFRONT_ENDPOINT ?? '';
export const AWS_SQS_POST_CLASSIFICATION_QUEUE_URL =
	env.AWS_SQS_POST_CLASSIFICATION_QUEUE_URL ?? '';
export const DB_REDIS_PASSWORD = env.DB_REDIS_PASSWORD ?? '';
export const DB_REDIS_URL = env.DB_REDIS_URL ?? '';
export const DEXBOORU_ML_API_URL = env.DEXBOORU_ML_API_URL ?? '';
export const DOMAIN = env.DOMAIN ?? '';
export const JWT_PRIVATE_KEY = env.JWT_PRIVATE_KEY ?? '';
export const OAUTH_DISCORD_CLIENT_ID = env.OAUTH_DISCORD_CLIENT_ID ?? '';
export const OAUTH_DISCORD_CLIENT_SECRET = env.OAUTH_DISCORD_CLIENT_SECRET ?? '';
export const OAUTH_GITHUB_CLIENT_ID = env.OAUTH_GITHUB_CLIENT_ID ?? '';
export const OAUTH_GITHUB_CLIENT_SECRET = env.OAUTH_GITHUB_CLIENT_SECRET ?? '';
export const OAUTH_GOOGLE_CLIENT_ID = env.OAUTH_GOOGLE_CLIENT_ID ?? '';
export const OAUTH_GOOGLE_CLIENT_SECRET = env.OAUTH_GOOGLE_CLIENT_SECRET ?? '';
export const OTP_PRIVATE_KEY = env.OTP_PRIVATE_KEY ?? '';
export const RABBITMQ_URL = env.RABBITMQ_URL ?? '';
export const SMTP_HOST = env.SMTP_HOST ?? '';
export const SMTP_PASSWORD = env.SMTP_PASSWORD ?? '';
export const SMTP_PORT = env.SMTP_PORT ?? '';
export const SMTP_USERNAME = env.SMTP_USERNAME ?? '';
export const WEBHOOK_SECRET = env.WEBHOOK_SECRET ?? '';
