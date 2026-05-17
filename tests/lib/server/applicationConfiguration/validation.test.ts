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
});
