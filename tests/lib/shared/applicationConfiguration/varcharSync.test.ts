import { buildDefaultApplicationConfiguration } from '$lib/shared/applicationConfiguration';
import {
	buildSearchableSyncWarningMessage,
	getChangedVarcharMappings,
	getSearchableSyncImpactFromUpdates,
} from '$lib/shared/applicationConfiguration/varcharSync';
import { describe, expect, it } from 'vitest';

describe('varchar sync planning', () => {
	const defaults = buildDefaultApplicationConfiguration();

	it('returns no mappings when updates are empty', () => {
		expect(getChangedVarcharMappings({}, defaults, defaults)).toEqual([]);
	});

	it('skips mappings when the updated value does not change the limit', () => {
		const mappings = getChangedVarcharMappings(
			{ likePostRateLimitMax: defaults.likePostRateLimitMax },
			defaults,
			defaults,
		);

		expect(mappings).toEqual([]);
	});

	it('includes only changed searchable mappings from the update payload', () => {
		const nextConfiguration = {
			...defaults,
			maximumCollectionTitleLength: 90,
		};

		const mappings = getChangedVarcharMappings(
			{ maximumCollectionTitleLength: 90 },
			defaults,
			nextConfiguration,
		);

		expect(mappings).toHaveLength(1);
		expect(mappings[0]).toMatchObject({
			table: 'PostCollection',
			column: 'title',
			configKey: 'maximumCollectionTitleLength',
		});
	});

	it('includes computed varchar mappings when a dependent key changes', () => {
		const nextConfiguration = {
			...defaults,
			maximumTagLength: 80,
		};

		const mappings = getChangedVarcharMappings(
			{ maximumTagLength: 80 },
			defaults,
			nextConfiguration,
		);

		expect(mappings.some((mapping) => mapping.column === 'name')).toBe(true);
		expect(mappings.some((mapping) => mapping.column === 'tagString')).toBe(true);
	});

	it('does not include unrelated searchable tables when only rate limits change', () => {
		const nextConfiguration = {
			...defaults,
			likePostRateLimitMax: defaults.likePostRateLimitMax + 1,
		};

		const mappings = getChangedVarcharMappings(
			{ likePostRateLimitMax: nextConfiguration.likePostRateLimitMax },
			defaults,
			nextConfiguration,
		);

		expect(mappings).toEqual([]);
	});

	it('reports searchable impact only for affected search indexes', () => {
		const nextConfiguration = {
			...defaults,
			maximumCollectionTitleLength: 90,
			likePostRateLimitMax: defaults.likePostRateLimitMax + 1,
		};

		const impact = getSearchableSyncImpactFromUpdates(
			{
				maximumCollectionTitleLength: 90,
				likePostRateLimitMax: nextConfiguration.likePostRateLimitMax,
			},
			defaults,
			nextConfiguration,
		);

		expect(impact).toEqual({
			configKeys: ['maximumCollectionTitleLength'],
			tables: ['PostCollection'],
		});
	});

	it('builds an owner-facing warning message', () => {
		const message = buildSearchableSyncWarningMessage(
			{
				configKeys: ['maximumCollectionTitleLength'],
				tables: ['PostCollection'],
			},
			{
				maximumCollectionTitleLength: 'Maximum collection title length',
			},
		);

		expect(message).toContain('Maximum collection title length');
		expect(message).toContain('collection search');
		expect(message).toContain('rebuild full-text search indexes');
	});
});
