import { building, dev } from '$app/environment';
import { RABBITMQ_URL } from '$env/static/private';
import { Connection } from 'rabbitmq-client';

const globalForRabbitMQ = globalThis as unknown as {
	rabbitmq: Connection | undefined;
};

const rabbitmq = (() => {
	if (building) {
		return null as unknown as Connection;
	}
	if (globalForRabbitMQ.rabbitmq) {
		return globalForRabbitMQ.rabbitmq;
	}
	const client = new Connection(RABBITMQ_URL);
	if (dev) {
		globalForRabbitMQ.rabbitmq = client;
	}
	return client;
})();

export default rabbitmq;
