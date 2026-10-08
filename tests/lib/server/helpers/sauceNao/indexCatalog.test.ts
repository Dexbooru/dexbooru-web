import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { mockLogger, mockPrisma } from '../../../../mocks';

const FIXTURE = readFileSync('tests/fixtures/sauceNaoIndexDetails.txt', 'utf8');
const NOW = new Date('2026-10-07T18:00:00.000Z');

const loadCatalog = async () => import('$lib/server/helpers/sauceNao/indexCatalog');

describe('parseSauceNaoIndexDetails', () => {
	it('reads mask bits from the mask column, including the shift after reserved index 17', async () => {
		const { parseSauceNaoIndexDetails } = await loadCatalog();
		const rows = parseSauceNaoIndexDetails(FIXTURE);
		const byId = new Map(rows.map((row) => [row.id, row]));

		expect(byId.get(5)).toEqual({ id: 5, maskBit: 5, name: 'pixiv', available: true });
		expect(byId.get(18)).toEqual({
			id: 18,
			maskBit: 17,
			name: 'H-MISC (nhentai)',
			available: true,
		});
		expect(byId.get(44)).toEqual({ id: 44, maskBit: 43, name: 'Skeb', available: true });
		expect(byId.get(1)).toEqual({ id: 1, maskBit: 1, name: 'h-anime', available: false });
		expect(byId.has(17)).toBe(false);
	});
});

describe('syncSauceNaoIndexCatalog', () => {
	const resetDb = () => {
		mockPrisma.$transaction.mockReset();
		mockPrisma.$transaction.mockImplementation(async (callback: unknown) => {
			if (typeof callback !== 'function') return callback;
			return await callback(mockPrisma);
		});
		mockPrisma.sauceNaoIndex.upsert.mockReset();
		mockPrisma.sauceNaoIndex.upsert.mockResolvedValue({});
		mockPrisma.sauceNaoIndex.updateMany.mockReset();
		mockPrisma.sauceNaoIndex.updateMany.mockResolvedValue({ count: 0 });
		mockLogger.error.mockReset();
	};

	it('default-enables a new listed index and does not write enabled for an index that already exists', async () => {
		resetDb();
		const { parseSauceNaoIndexDetails, syncSauceNaoIndexCatalog } = await loadCatalog();
		const fetchImpl = vi.fn(async () => new Response(FIXTURE, { status: 200 }));

		await syncSauceNaoIndexCatalog({
			fetch: fetchImpl,
			now: () => NOW,
			sleep: async () => undefined,
			random: () => 0,
		});

		const upserts = mockPrisma.sauceNaoIndex.upsert.mock.calls.map((call) => call[0]);
		const pixiv = upserts.find((call) => call.where.id === 5);
		const hcg = upserts.find((call) => call.where.id === 2);
		expect(pixiv?.create).toEqual({
			id: 5,
			maskBit: 5,
			name: 'pixiv',
			available: true,
			enabled: true,
			sourceType: null,
			lastSyncedAt: NOW,
		});
		expect(pixiv?.update).toEqual({
			maskBit: 5,
			name: 'pixiv',
			available: true,
			lastSyncedAt: NOW,
		});
		expect(hcg?.create).toEqual({
			id: 2,
			maskBit: 2,
			name: 'hcg',
			available: true,
			enabled: false,
			sourceType: 'VIDEOGAME',
			lastSyncedAt: NOW,
		});
		expect(hcg?.update).toEqual({
			maskBit: 2,
			name: 'hcg',
			available: true,
			lastSyncedAt: NOW,
		});
		const notIn = mockPrisma.sauceNaoIndex.updateMany.mock.calls[0]?.[0].where.id.notIn as number[];
		expect(notIn).toEqual(parseSauceNaoIndexDetails(FIXTURE).map((row) => row.id));
		expect(notIn[0]).toBe(0);
		expect(notIn.at(-1)).toBe(44);
		expect(notIn).not.toContain(17);
		expect(mockPrisma.sauceNaoIndex.updateMany).toHaveBeenCalledWith({
			where: { id: { notIn } },
			data: { available: false },
		});
	});

	it('leaves the catalog untouched when fewer than 10 rows parse', async () => {
		resetDb();
		const { parseSauceNaoIndexDetails, syncSauceNaoIndexCatalog } = await loadCatalog();
		const nineRows = Array.from(
			{ length: 9 },
			(_, id) => `0x${(1 << id).toString(16)}\t#${id}\t\t1\t\tindex-${id}`,
		).join('\n');
		expect(parseSauceNaoIndexDetails(nineRows).map((row) => row.id)).toEqual([
			0, 1, 2, 3, 4, 5, 6, 7, 8,
		]);
		const fetchImpl = vi.fn(async () => new Response(nineRows, { status: 200 }));

		await syncSauceNaoIndexCatalog({
			fetch: fetchImpl,
			now: () => NOW,
			sleep: async () => undefined,
			random: () => 0,
		});

		expect(mockPrisma.$transaction).not.toHaveBeenCalled();
		expect(mockLogger.error).toHaveBeenCalledWith(
			'SauceNAO index details changed format. Leaving the catalog unchanged.',
		);
	});

	it('retries a timed-out fetch and then writes the catalog', async () => {
		resetDb();
		const { syncSauceNaoIndexCatalog } = await loadCatalog();
		const timeout = vi.spyOn(AbortSignal, 'timeout');
		const sleeps: number[] = [];
		let attempt = 0;
		const fetchImpl = vi.fn(async () => {
			attempt += 1;
			if (attempt === 1) throw new DOMException('timed out', 'TimeoutError');
			return new Response(FIXTURE, { status: 200 });
		});

		try {
			await syncSauceNaoIndexCatalog({
				fetch: fetchImpl,
				now: () => NOW,
				sleep: async (milliseconds) => {
					sleeps.push(milliseconds);
				},
				random: () => 0.5,
			});
			expect(fetchImpl).toHaveBeenCalledTimes(2);
			expect(sleeps).toEqual([500]);
			expect(timeout).toHaveBeenCalledWith(15_000);
			const pixiv = mockPrisma.sauceNaoIndex.upsert.mock.calls.find(
				(call) => call[0].where.id === 5,
			)?.[0];
			expect(pixiv?.create.enabled).toBe(true);
			expect(pixiv?.create.maskBit).toBe(5);
		} finally {
			timeout.mockRestore();
		}
	});
});
