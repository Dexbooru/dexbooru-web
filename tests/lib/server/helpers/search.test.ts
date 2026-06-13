import { describe, expect, it } from 'vitest';
import QueryBuilder from '$lib/server/helpers/search';

const baseInput = {
	rawQuery: '',
	pageNumber: 2,
	limit: 25,
	ascending: false,
	orderBy: 'createdAt' as const,
	handlerType: 'page-server-load' as const,
};

describe('QueryBuilder', () => {
	it('builds OR condition for bare tag token', () => {
		const result = new QueryBuilder({ ...baseInput, rawQuery: 'cat' }).buildOrmQuery();

		expect(result.where?.AND).toEqual([
			{
				OR: [
					{ tags: { some: { name: { equals: 'cat' } } } },
					{ artists: { some: { name: { equals: 'cat' } } } },
				],
			},
		]);
	});

	it('builds numeric filter for likes:>10', () => {
		const result = new QueryBuilder({ ...baseInput, rawQuery: 'likes:>10' }).buildOrmQuery();

		expect(result.where?.AND).toEqual([{ likes: { gt: 10 } }]);
	});

	it('places negated bare tag in NOT', () => {
		const result = new QueryBuilder({ ...baseInput, rawQuery: '-cat' }).buildOrmQuery();

		expect(result.where?.NOT).toEqual([
			{
				OR: [
					{ tags: { some: { name: { equals: 'cat' } } } },
					{ artists: { some: { name: { equals: 'cat' } } } },
				],
			},
		]);
	});

	it('throws for invalid prefix', () => {
		expect(() =>
			new QueryBuilder({ ...baseInput, rawQuery: 'invalidPrefix:value' }).buildOrmQuery(),
		).toThrow('Invalid prefix: invalidPrefix for the value: value');
	});

	it('applies pagination and orderBy', () => {
		const result = new QueryBuilder({
			...baseInput,
			rawQuery: 'cat',
			pageNumber: 2,
			limit: 10,
			ascending: true,
			orderBy: 'likes',
		}).buildOrmQuery();

		expect(result.skip).toBe(20);
		expect(result.take).toBe(10);
		expect(result.orderBy).toEqual({ likes: 'asc' });
	});
});
