import type { Publisher } from 'rabbitmq-client';
import logger from '../logging/logger';
import rabbitmq from './client';

export abstract class BasePublisher<T> {
	public static MAX_RETRIES: number = 3;
	public static CONFIRM_DELIVERY: boolean = true;

	protected readonly exchange: string;
	private publisher: Publisher;

	constructor(exchange: string) {
		this.exchange = exchange;

		if (!rabbitmq) {
			logger.warn('RabbitMQ connection is not initialized. Publisher will not be functional.');
			this.publisher = null as unknown as Publisher;
			return;
		}

		this.publisher = rabbitmq.createPublisher({
			confirm: BasePublisher.CONFIRM_DELIVERY,
			maxAttempts: BasePublisher.MAX_RETRIES,
			exchanges: [{ exchange: this.exchange, type: 'topic', durable: true }],
		});

		this.publisher.on('retry', (err, envelope) => {
			logger.error(`RabbitMQ Publisher retry attempt on exchange ${this.exchange}:`, {
				err,
				envelope,
			});
		});
	}

	public async publish(routingKey: string, data: unknown): Promise<void> {
		if (!this.publisher) {
			logger.error(`Cannot publish to ${this.exchange}: Publisher not initialized.`);
			return;
		}

		try {
			const messageDto = this.toMessageDto(data);
			await this.publisher.send({ exchange: this.exchange, routingKey }, messageDto);

			logger.debug(`Published message to exchange ${this.exchange} with routing key ${routingKey}`);
		} catch (error) {
			logger.error(
				`Failed to publish message to exchange ${this.exchange} with routing key ${routingKey}:`,
				error,
			);
			throw error;
		}
	}

	public async close(): Promise<void> {
		if (this.publisher) {
			await this.publisher.close();
		}
	}

	public abstract toMessageDto(_data: unknown): T;
}
