import { building } from '$app/environment';

export const RABBITMQ_CONNECT = !building;

export const NOTIFICATION_EXCHANGE = 'notification_events';
export const AI_EVENTS_EXCHANGE = 'ai_events';
