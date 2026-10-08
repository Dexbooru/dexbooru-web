import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockControllerHelpers, mockPrisma } from '../../../../mocks';

const catalog = [
	{
		id: 5,
		maskBit: 5,
		name: 'pixiv',
		available: true,
		enabled: true,
		sourceType: null,
	},
	{
		id: 9,
		maskBit: 9,
		name: 'danbooru',
		available: true,
		enabled: false,
		sourceType: null,
	},
];

vi.mock('$lib/server/controllers/moderation/ownerRoleCheck', () => ({
	handleOwnerRoleCheck: vi.fn(async () => undefined),
}));

describe('handleSetEnabledSauceNaoIndexes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPrisma.sauceNaoIndex.findMany.mockResolvedValue(catalog);
		mockPrisma.sauceNaoIndex.updateMany.mockResolvedValue({ count: 1 });
		mockPrisma.$transaction.mockImplementation(async (callback: unknown) => {
			if (typeof callback !== 'function') return callback;
			return await callback(mockPrisma);
		});
	});

	it('dedupes enabled index ids and enables only those available rows', async () => {
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) =>
				callback({ body: { enabledIndexIds: [9, 5, 5] } }),
		);
		const { handleSetEnabledSauceNaoIndexes } = await import('$lib/server/controllers/sauceNao');

		const response = await handleSetEnabledSauceNaoIndexes({} as never);

		expect(response).toMatchObject({ status: 200, data: catalog });
		expect(mockPrisma.sauceNaoIndex.updateMany).toHaveBeenNthCalledWith(1, {
			where: { available: true, id: { notIn: [9, 5] } },
			data: { enabled: false },
		});
		expect(mockPrisma.sauceNaoIndex.updateMany).toHaveBeenNthCalledWith(2, {
			where: { available: true, id: { in: [9, 5] } },
			data: { enabled: true },
		});
	});

	it('rejects an id that is not in the available catalog', async () => {
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) =>
				callback({ body: { enabledIndexIds: [5, 17] } }),
		);
		const { handleSetEnabledSauceNaoIndexes } = await import('$lib/server/controllers/sauceNao');

		const response = await handleSetEnabledSauceNaoIndexes({} as never);

		expect(response).toMatchObject({
			status: 400,
			message: 'Unknown SauceNAO index id: 17',
		});
		expect(mockPrisma.$transaction).not.toHaveBeenCalled();
	});
});
