import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import logger from '../logging/logger';
import type { TImageData } from '../types/images';
import type { TImageTransformPreset } from '../types/upload';
import type {
	TImageTransformWorkerRequest,
	TImageTransformWorkerResponse,
} from './imageTransformWorkerTypes';

type TPendingJob = {
	resolve: (value: TImageData) => void;
	reject: (reason: Error) => void;
};

const MAX_POOL_SIZE = 3;

const createWorkerInstance = (): Worker => {
	const workerUrl = new URL('./imageTransformWorker.ts', import.meta.url);
	const workerPath = fileURLToPath(workerUrl);
	const needsTsLoader = workerPath.endsWith('.ts');

	return new Worker(workerUrl, {
		// Vite/adapter-node emit a .js worker chunk in production; in vitest/vite-dev the
		// source is still .ts and must be loaded through tsx outside Vite's resolver.
		...(needsTsLoader ? { execArgv: ['--import', 'tsx'] } : {}),
	});
};

class ImageTransformPool {
	private readonly workers: Worker[] = [];
	private readonly idleWorkers: Worker[] = [];
	private readonly pendingById = new Map<string, TPendingJob>();
	private readonly workerJobIds = new Map<Worker, Set<string>>();
	private readonly waitQueue: Array<{
		request: TImageTransformWorkerRequest;
		pending: TPendingJob;
	}> = [];
	private nextId = 0;

	private rejectWorkerJobs(worker: Worker, reason: Error) {
		const jobIds = this.workerJobIds.get(worker);
		if (!jobIds) return;

		for (const jobId of jobIds) {
			const pending = this.pendingById.get(jobId);
			if (pending) {
				pending.reject(reason);
				this.pendingById.delete(jobId);
			}
		}
		this.workerJobIds.delete(worker);
	}

	private createWorker(): Worker {
		const worker = createWorkerInstance();
		this.workerJobIds.set(worker, new Set());

		worker.on('message', (response: TImageTransformWorkerResponse) => {
			const pending = this.pendingById.get(response.id);
			this.workerJobIds.get(worker)?.delete(response.id);

			if (!pending) {
				return;
			}
			this.pendingById.delete(response.id);

			if (response.ok) {
				const imageData: TImageData = {
					buffers: {
						original: Buffer.from(response.result.buffers.original),
						...(response.result.buffers.preview
							? { preview: Buffer.from(response.result.buffers.preview) }
							: {}),
						...(response.result.buffers.nsfwPreview
							? { nsfwPreview: Buffer.from(response.result.buffers.nsfwPreview) }
							: {}),
					},
					metadata: response.result.metadata,
				};
				pending.resolve(imageData);
			} else {
				pending.reject(new Error(response.error));
			}

			this.idleWorkers.push(worker);
			this.drainQueue();
		});

		worker.on('error', (error) => {
			logger.error('Image transform worker error', { error });
			this.rejectWorkerJobs(
				worker,
				error instanceof Error ? error : new Error('Image transform worker error'),
			);
		});

		worker.on('exit', (code) => {
			const index = this.workers.indexOf(worker);
			if (index >= 0) {
				this.workers.splice(index, 1);
			}
			const idleIndex = this.idleWorkers.indexOf(worker);
			if (idleIndex >= 0) {
				this.idleWorkers.splice(idleIndex, 1);
			}
			if (code !== 0) {
				logger.error('Image transform worker exited unexpectedly', { code });
				this.rejectWorkerJobs(worker, new Error(`Image transform worker exited with code ${code}`));
			}
		});

		this.workers.push(worker);
		return worker;
	}

	private acquireWorker(): Worker | null {
		const idle = this.idleWorkers.pop();
		if (idle) return idle;
		if (this.workers.length < MAX_POOL_SIZE) {
			return this.createWorker();
		}
		return null;
	}

	private dispatch(worker: Worker, request: TImageTransformWorkerRequest, pending: TPendingJob) {
		this.pendingById.set(request.id, pending);
		this.workerJobIds.get(worker)?.add(request.id);
		worker.postMessage(request);
	}

	private drainQueue() {
		while (this.waitQueue.length > 0) {
			const worker = this.acquireWorker();
			if (!worker) return;

			const next = this.waitQueue.shift();
			if (!next) return;

			this.dispatch(worker, next.request, next.pending);
		}
	}

	public transform(
		buffer: Buffer,
		isNsfw: boolean,
		preset: TImageTransformPreset = 'post',
	): Promise<TImageData> {
		const id = String(++this.nextId);
		const request: TImageTransformWorkerRequest = {
			id,
			buffer: new Uint8Array(buffer),
			isNsfw,
			preset,
		};

		return new Promise<TImageData>((resolve, reject) => {
			const pending: TPendingJob = { resolve, reject };
			const worker = this.acquireWorker();
			if (!worker) {
				this.waitQueue.push({ request, pending });
				return;
			}
			this.dispatch(worker, request, pending);
		});
	}

	public async close(): Promise<void> {
		await Promise.all(this.workers.map((worker) => worker.terminate()));
		this.workers.length = 0;
		this.idleWorkers.length = 0;
		this.pendingById.clear();
		this.workerJobIds.clear();
		this.waitQueue.length = 0;
	}
}

const globalForPool = globalThis as unknown as {
	imageTransformPool?: ImageTransformPool;
};

export const imageTransformPool = globalForPool.imageTransformPool ?? new ImageTransformPool();

if (process.env.NODE_ENV !== 'production') {
	globalForPool.imageTransformPool = imageTransformPool;
}
