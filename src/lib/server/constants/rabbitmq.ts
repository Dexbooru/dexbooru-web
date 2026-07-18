import { building } from '$app/environment';

export const RABBITMQ_CONNECT = !building;

export const NOTIFICATION_EXCHANGE = 'notification_events';
export const AI_EVENTS_EXCHANGE = 'ai_events';
export const UPLOAD_EVENTS_EXCHANGE = 'upload_events';
export const MEDIA_UPLOADS_ROUTING_KEY = 'media_uploads';
export const MEDIA_UPLOADS_QUEUE = 'media_uploads';
