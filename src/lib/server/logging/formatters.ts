import type { RequestEvent } from '@sveltejs/kit';
import winston from 'winston';
import { isRequestEvent } from '../helpers/controllers';

const formatEvent = (incomingEvent: RequestEvent) => {
	const method = incomingEvent.request.method;
	const path = incomingEvent.url.pathname + incomingEvent.url.search;

	return `${method} ${path}`;
};

const applyFormatterFunction = (message: unknown) => {
	if (isRequestEvent(message)) {
		return formatEvent(message as RequestEvent);
	}

	return message;
};

const formatData = winston.format.printf(({ message, level, timestamp, ...meta }) => {
	const formattedMessage = applyFormatterFunction(message);
	const stringifiedMeta = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';

	return `${timestamp} ${level}: ${formattedMessage}${stringifiedMeta}`;
});

export default formatData;
