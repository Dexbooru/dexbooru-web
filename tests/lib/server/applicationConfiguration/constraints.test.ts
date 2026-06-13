import { buildDefaultApplicationConfiguration } from '$lib/shared/applicationConfiguration';
import { describe, expect, it } from 'vitest';
import { mockPrisma } from '../../../mocks';

const getSqlCalls = () =>
	mockPrisma.$executeRaw.mock.calls.map(([query]) => {
		if (typeof query === 'string') return query;
		if (query && typeof query === 'object' && 'strings' in query) {
			return (query as { strings: string[] }).strings.join('?');
		}
		return String(query);
	});

describe('syncDatabaseVarcharConstraints', () => {
	it('skips database work when no varchar limits changed', async () => {
		mockPrisma.$executeRaw.mockResolvedValue(1);
		const { syncDatabaseVarcharConstraints } =
			await import('$lib/server/applicationConfiguration/constraints');
		const configuration = buildDefaultApplicationConfiguration();

		await syncDatabaseVarcharConstraints({
			updates: { likePostRateLimitMax: configuration.likePostRateLimitMax },
			previousConfiguration: configuration,
			nextConfiguration: configuration,
		});

		expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
	});

	it('alters only changed mapped varchar columns from the update payload', async () => {
		mockPrisma.$executeRaw.mockResolvedValue(1);
		const { syncDatabaseVarcharConstraints } =
			await import('$lib/server/applicationConfiguration/constraints');
		const previousConfiguration = buildDefaultApplicationConfiguration();
		const nextConfiguration = {
			...previousConfiguration,
			maximumCommentContentLength: 1200,
		};

		await syncDatabaseVarcharConstraints({
			updates: { maximumCommentContentLength: 1200 },
			previousConfiguration,
			nextConfiguration,
		});

		const sqlCalls = getSqlCalls();
		expect(sqlCalls.some((sql) => sql.includes('ALTER TABLE "Comment"'))).toBe(true);
		expect(
			sqlCalls.some((sql) => sql.includes('DROP INDEX IF EXISTS collection_searchable_idx')),
		).toBe(false);
	});

	it('drops and recreates searchable when a searchable-dependent limit changes', async () => {
		mockPrisma.$executeRaw.mockResolvedValue(1);
		const { syncDatabaseVarcharConstraints } =
			await import('$lib/server/applicationConfiguration/constraints');
		const previousConfiguration = buildDefaultApplicationConfiguration();
		const nextConfiguration = {
			...previousConfiguration,
			maximumCollectionTitleLength: 90,
		};

		await syncDatabaseVarcharConstraints({
			updates: { maximumCollectionTitleLength: 90 },
			previousConfiguration,
			nextConfiguration,
		});

		const sqlCalls = getSqlCalls();

		expect(
			sqlCalls.some((sql) => sql.includes('DROP INDEX IF EXISTS collection_searchable_idx')),
		).toBe(true);
		expect(
			sqlCalls.some(
				(sql) => sql.includes('ALTER TABLE "PostCollection"') && sql.includes('DROP COLUMN'),
			),
		).toBe(true);
		expect(
			sqlCalls.some(
				(sql) => sql.includes('ADD COLUMN searchable tsvector') && sql.includes('COALESCE(title'),
			),
		).toBe(true);
		expect(sqlCalls.some((sql) => sql.includes('CREATE INDEX collection_searchable_idx'))).toBe(
			true,
		);
	});
});
