import { buildDefaultApplicationConfiguration } from '$lib/shared/applicationConfiguration';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockPrisma } from '../../../../mocks';

const sqlText = (query: unknown) => {
	if (query && typeof query === 'object' && 'strings' in query) {
		return (query as { strings: string[] }).strings.join('?');
	}
	return String(query);
};

describe('updateApplicationConfiguration', () => {
	beforeEach(() => {
		mockPrisma.$queryRaw.mockReset();
		mockPrisma.$queryRaw.mockResolvedValue([buildDefaultApplicationConfiguration()]);
	});

	it('casts an index list to int[]', async () => {
		const { updateApplicationConfiguration } =
			await import('$lib/server/db/actions/applicationConfiguration');
		await updateApplicationConfiguration({ sauceNaoEnabledIndexes: [5, 9] });

		expect(sqlText(mockPrisma.$queryRaw.mock.calls[0]?.[0])).toContain('::int[]');
	});

	it('writes an empty index list as an empty int array', async () => {
		const { updateApplicationConfiguration } =
			await import('$lib/server/db/actions/applicationConfiguration');
		await updateApplicationConfiguration({ sauceNaoEnabledIndexes: [] });

		expect(sqlText(mockPrisma.$queryRaw.mock.calls[0]?.[0])).toContain('ARRAY[]::int[]');
	});

	it('does not cast numeric fields to int[]', async () => {
		const { updateApplicationConfiguration } =
			await import('$lib/server/db/actions/applicationConfiguration');
		await updateApplicationConfiguration({ sauceNaoMinimumSimilarity: 80 });

		expect(sqlText(mockPrisma.$queryRaw.mock.calls[0]?.[0])).not.toContain('::int[]');
	});
});
