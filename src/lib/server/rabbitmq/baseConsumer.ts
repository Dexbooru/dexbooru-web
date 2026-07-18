import type { AsyncMessage, Consumer, ConsumerHandler, ConsumerStatus } from 'rabbitmq-client';
import logger from '../logging/logger';
import rabbitmq from './client';

export type TBaseConsumerOptions = {
	exchange: string;
	routingKey: string;
	queue: string;
	prefetchCount?: number;
	concurrency?: number;
	requeue?: boolean;
};

/**
 * Template Method consumer: declares exchange/queue/binding and runs {@link handleMessage}.
 */
export abstract class BaseConsumer {
	protected readonly exchange: string;
	protected readonly routingKey: string;
	protected readonly queue: string;
	protected readonly prefetchCount: number;
	protected readonly concurrency: number;
	protected readonly requeue: boolean;
	private consumer: Consumer | null = null;

	constructor(options: TBaseConsumerOptions) {
		this.exchange = options.exchange;
		this.routingKey = options.routingKey;
		this.queue = options.queue;
		this.prefetchCount = options.prefetchCount ?? 1;
		this.concurrency = options.concurrency ?? 1;
		this.requeue = options.requeue ?? false;
	}

	public start(): void {
		if (!rabbitmq) {
			logger.warn(`Cannot start consumer for queue ${this.queue}: RabbitMQ is not initialized`);
			return;
		}
		if (this.consumer) {
			return;
		}

		const handler: ConsumerHandler = async (msg) => {
			return await this.handleMessage(msg);
		};

		this.consumer = rabbitmq.createConsumer(
			{
				queue: this.queue,
				queueOptions: { durable: true },
				qos: { prefetchCount: this.prefetchCount },
				concurrency: this.concurrency,
				requeue: this.requeue,
				exchanges: [{ exchange: this.exchange, type: 'topic', durable: true }],
				queueBindings: [{ exchange: this.exchange, routingKey: this.routingKey }],
			},
			handler,
		);

		this.consumer.on('error', (err) => {
			logger.error(`RabbitMQ consumer error on queue ${this.queue}`, { err });
		});

		this.consumer.on('ready', () => {
			logger.info(`RabbitMQ consumer ready on queue ${this.queue}`);
		});
	}

	public async close(): Promise<void> {
		if (this.consumer) {
			await this.consumer.close();
			this.consumer = null;
		}
	}

	protected abstract handleMessage(msg: AsyncMessage): Promise<ConsumerStatus | void>;
}
