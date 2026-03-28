/**
 * One RabbitMQ cluster (`RABBITMQ_URL`), multiple topic exchanges:
 * notifications vs AI workloads stay isolated by exchange name.
 */
export const NOTIFICATION_EXCHANGE = 'notification_events';

/** AI / embedding pipeline; must match dexbooru-ai `PRIMARY_EXCHANGE_NAME` (default `ai_events`). */
export const AI_EVENTS_EXCHANGE = 'ai_events';
