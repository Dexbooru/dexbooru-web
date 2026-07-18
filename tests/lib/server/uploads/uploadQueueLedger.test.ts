import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('$lib/server/db/redis');
vi.unmock('$lib/server/events/uploadStatus');

type TZsetMember = { score: number; value: string };

const createMemoryRedis = () => {
	let seq = 0;
	const waiting: TZsetMember[] = [];

	const sorted = () =>
		[...waiting].sort((a, b) => a.score - b.score || a.value.localeCompare(b.value));

	return {
		incr: vi.fn(async () => {
			seq += 1;
			return seq;
		}),
		zAdd: vi.fn(async (_key: string, member: TZsetMember) => {
			const existing = waiting.findIndex((item) => item.value === member.value);
			if (existing >= 0) {
				waiting[existing] = member;
				return 0;
			}
			waiting.push(member);
			return 1;
		}),
		zRem: vi.fn(async (_key: string, value: string) => {
			const index = waiting.findIndex((item) => item.value === value);
			if (index < 0) return 0;
			waiting.splice(index, 1);
			return 1;
		}),
		zRange: vi.fn(async () => sorted().map((item) => item.value)),
		zRank: vi.fn(async (_key: string, value: string) => {
			const rank = sorted().findIndex((item) => item.value === value);
			return rank >= 0 ? rank : null;
		}),
		zCard: vi.fn(async () => waiting.length),
		_waiting: waiting,
	};
};

const emitUploadProgress = vi.fn(async () => undefined);

vi.mock('$lib/server/db/redis', () => ({
	default: {},
}));

vi.mock('$lib/server/events/uploadStatus', () => ({
	emitUploadProgress,
}));

vi.mock('$lib/server/logging/logger', () => ({
	default: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

describe('uploadQueueLedger', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('formats queue position messages', async () => {
		const { formatQueuePositionMessage } = await import('$lib/server/uploads/uploadQueueLedger');
		expect(formatQueuePositionMessage(1)).toBe("Queued — you're next");
		expect(formatQueuePositionMessage(0)).toBe("Queued — you're next");
		expect(formatQueuePositionMessage(3)).toBe('Queued — position 3');
	});

	it('enqueues with monotonic scores and reports 1-based position', async () => {
		const memoryRedis = createMemoryRedis();
		vi.doMock('$lib/server/db/redis', () => ({ default: memoryRedis }));

		const { enqueueUploadQueue, getUploadQueueDepth } =
			await import('$lib/server/uploads/uploadQueueLedger');

		const first = await enqueueUploadQueue('upload-a');
		const second = await enqueueUploadQueue('upload-b');

		expect(first).toBe(1);
		expect(second).toBe(2);
		expect(await getUploadQueueDepth()).toBe(2);
		expect(emitUploadProgress).toHaveBeenNthCalledWith(1, 'upload-a', "Queued — you're next");
		expect(emitUploadProgress).toHaveBeenNthCalledWith(2, 'upload-b', 'Queued — position 2');
	});

	it('notifies remaining waiters when the head leaves the queue', async () => {
		const memoryRedis = createMemoryRedis();
		vi.doMock('$lib/server/db/redis', () => ({ default: memoryRedis }));

		const { enqueueUploadQueue, leaveUploadQueue } =
			await import('$lib/server/uploads/uploadQueueLedger');

		await enqueueUploadQueue('upload-a');
		await enqueueUploadQueue('upload-b');
		await enqueueUploadQueue('upload-c');
		emitUploadProgress.mockClear();

		const removed = await leaveUploadQueue('upload-a');

		expect(removed).toBe(true);
		expect(emitUploadProgress).toHaveBeenCalledTimes(2);
		expect(emitUploadProgress).toHaveBeenCalledWith('upload-b', "Queued — you're next");
		expect(emitUploadProgress).toHaveBeenCalledWith('upload-c', 'Queued — position 2');
	});

	it('is a no-op leave when the upload is not waiting', async () => {
		const memoryRedis = createMemoryRedis();
		vi.doMock('$lib/server/db/redis', () => ({ default: memoryRedis }));

		const { leaveUploadQueue } = await import('$lib/server/uploads/uploadQueueLedger');
		const removed = await leaveUploadQueue('missing');

		expect(removed).toBe(false);
		expect(emitUploadProgress).not.toHaveBeenCalled();
	});

	it('keeps FIFO order by score even if uploadIds sort differently', async () => {
		const memoryRedis = createMemoryRedis();
		vi.doMock('$lib/server/db/redis', () => ({ default: memoryRedis }));

		const { enqueueUploadQueue, leaveUploadQueue } =
			await import('$lib/server/uploads/uploadQueueLedger');

		await enqueueUploadQueue('z-last-lex');
		await enqueueUploadQueue('a-first-lex');
		emitUploadProgress.mockClear();

		await leaveUploadQueue('z-last-lex');

		expect(emitUploadProgress).toHaveBeenCalledTimes(1);
		expect(emitUploadProgress).toHaveBeenCalledWith('a-first-lex', "Queued — you're next");
	});
});
