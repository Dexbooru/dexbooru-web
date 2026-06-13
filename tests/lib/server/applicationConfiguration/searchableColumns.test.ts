import { describe, expect, it } from 'vitest';
import { tableRequiresSearchableRebuild } from '$lib/server/applicationConfiguration/searchableColumns';

describe('tableRequiresSearchableRebuild', () => {
	it('returns true when altering searchable-dependent PostCollection columns', () => {
		expect(tableRequiresSearchableRebuild('PostCollection', ['title'])).toBe(true);
		expect(tableRequiresSearchableRebuild('PostCollection', ['description'])).toBe(true);
	});

	it('returns false for tables without searchable generated columns', () => {
		expect(tableRequiresSearchableRebuild('Comment', ['content'])).toBe(false);
	});

	it('returns false when altering non-dependent columns on searchable tables', () => {
		expect(tableRequiresSearchableRebuild('Post', ['sourceLink'])).toBe(false);
	});
});
