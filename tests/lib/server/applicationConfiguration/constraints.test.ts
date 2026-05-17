import { buildDefaultApplicationConfiguration } from '$lib/shared/applicationConfiguration';
import { describe, expect, it } from 'vitest';
import { mockPrisma } from '../../../mocks';

describe('syncDatabaseVarcharConstraints', () => {
	it('emits ALTER TABLE statements for mapped fields', async () => {
		mockPrisma.$executeRaw.mockResolvedValue(1);
		const { syncDatabaseVarcharConstraints } =
			await import('$lib/server/applicationConfiguration/constraints');

		await syncDatabaseVarcharConstraints(buildDefaultApplicationConfiguration());

		expect(mockPrisma.$executeRaw).toHaveBeenCalled();
		expect(mockPrisma.$executeRaw.mock.calls.length).toBeGreaterThan(5);
	});
});
