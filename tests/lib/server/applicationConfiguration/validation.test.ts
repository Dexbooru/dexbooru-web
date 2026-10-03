import { describe, expect, it } from 'vitest';
import { mockPrisma } from '../../../mocks';
import { buildDefaultApplicationConfiguration } from '$lib/shared/applicationConfiguration';
import { validateApplicationConfigurationUpdate } from '$lib/server/applicationConfiguration';

describe('validateApplicationConfigurationUpdate', () => {
	it('rejects invalid min-max auth relationships', async () => {
		await expect(
			validateApplicationConfigurationUpdate(
				{
					minimumUsernameLength: 20,
					maximumUsernameLength: 10,
				},
				buildDefaultApplicationConfiguration(),
			),
		).rejects.toThrow('minimumUsernameLength');
	});

	it('rejects reduced varchar lengths below current row data max', async () => {
		mockPrisma.$queryRaw.mockResolvedValue([{ maxLength: 120 }]);
		await expect(
			validateApplicationConfigurationUpdate(
				{
					maximumTagLength: 100,
				},
				{
					...buildDefaultApplicationConfiguration(),
					maximumTagLength: 150,
				},
			),
		).rejects.toThrow('cannot reduce limit');
	});

	it('rejects increased minimumUsernameLength above the shortest existing username', async () => {
		mockPrisma.$queryRaw.mockResolvedValue([{ minLength: 3 }]);
		await expect(
			validateApplicationConfigurationUpdate(
				{
					minimumUsernameLength: 5,
				},
				buildDefaultApplicationConfiguration(),
			),
		).rejects.toThrow('cannot raise minimum length');
	});

	it('allows increased minimumUsernameLength when existing usernames meet the new minimum', async () => {
		mockPrisma.$queryRaw.mockResolvedValue([{ minLength: 6 }]);
		await expect(
			validateApplicationConfigurationUpdate(
				{
					minimumUsernameLength: 5,
				},
				buildDefaultApplicationConfiguration(),
			),
		).resolves.toBeUndefined();
	});

	it('rejects sauceNao similarity outside 1..100', async () => {
		await expect(
			validateApplicationConfigurationUpdate(
				{ sauceNaoMinimumSimilarity: 0 },
				buildDefaultApplicationConfiguration(),
			),
		).rejects.toThrow('"sauceNaoMinimumSimilarity" must be greater than or equal to 1.');

		await expect(
			validateApplicationConfigurationUpdate(
				{ sauceNaoMinimumSimilarity: 101 },
				buildDefaultApplicationConfiguration(),
			),
		).rejects.toThrow('"sauceNaoMinimumSimilarity" must be less than or equal to 100.');
	});

	it('rejects unknown sauceNao index ids and dedupes known ones', async () => {
		await expect(
			validateApplicationConfigurationUpdate(
				{ sauceNaoEnabledIndexes: [5, 17] },
				buildDefaultApplicationConfiguration(),
			),
		).rejects.toThrow('Unknown SauceNAO index id: 17');

		const updates = { sauceNaoEnabledIndexes: [5, 5, 9] };
		await expect(
			validateApplicationConfigurationUpdate(updates, buildDefaultApplicationConfiguration()),
		).resolves.toBeUndefined();
		expect(updates.sauceNaoEnabledIndexes).toEqual([5, 9]);
	});

	it('allows an empty sauceNao index list', async () => {
		await expect(
			validateApplicationConfigurationUpdate(
				{ sauceNaoEnabledIndexes: [] },
				buildDefaultApplicationConfiguration(),
			),
		).resolves.toBeUndefined();
	});

	it('allows increased minimumUsernameLength when there are no users', async () => {
		mockPrisma.$queryRaw.mockResolvedValue([{ minLength: null }]);
		await expect(
			validateApplicationConfigurationUpdate(
				{
					minimumUsernameLength: 5,
				},
				buildDefaultApplicationConfiguration(),
			),
		).resolves.toBeUndefined();
	});
});
