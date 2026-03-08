import type { TRequestSchema } from '../types/controllers';

export const VALID_REQUEST_TYPES: (keyof TRequestSchema)[] = [
	'form',
	'urlSearchParams',
	'pathParams',
	'body',
];
export const VALID_FORM_APPLICATION_TYPES = [
	'multipart/form-data',
	'application/x-www-form-urlencoded',
];
export const VALID_APPLICATION_REQUEST_TYPES = [
	...VALID_FORM_APPLICATION_TYPES,
	'application/json',
	'application/text',
];

export const VALID_REQUEST_EVENT_KEYS = ['locals', 'params', 'getClientAddress', 'request', 'url'];
