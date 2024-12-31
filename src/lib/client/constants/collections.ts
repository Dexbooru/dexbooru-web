import type { TCollectionOrderByColumn } from '$lib/shared/types/collections';
import type { TOrderByTranslationMap } from '../types/collections';

export const COLLECTIONS_ANIMATION_DURATION_MS = 500;

export const INDIVIDUAL_COLLECTION_PATH_REGEX = new RegExp(
	'^/collections/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
);

export const getLabelFromOrderby = (
	orderBy: TCollectionOrderByColumn,
	ascending: boolean,
): string | null => {
	const item = ORDER_BY_TRANSLATION_MAP[orderBy][!ascending ? 0 : 1];
	return item.label;
};

export const ORDER_BY_TRANSLATION_MAP: TOrderByTranslationMap = {
	createdAt: [
		{
			label: 'Most recent',
			isActive(orderBy, ascending) {
				return orderBy === 'createdAt' && !ascending;
			},
			getHref(collectionsPageBaseUrl) {
				const url = new URL(collectionsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'createdAt');
				url.searchParams.append('ascending', 'false');

				return url.href;
			},
		},
		{
			label: 'Least recent',
			isActive(orderBy, ascending) {
				return orderBy === 'createdAt' && ascending;
			},
			getHref(collectionsPageBaseUrl) {
				const url = new URL(collectionsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'createdAt');
				url.searchParams.append('ascending', 'true');

				return url.href;
			},
		},
	],
	updatedAt: [
		{
			label: 'Last updated at',
			isActive(orderBy, ascending) {
				return orderBy === 'updatedAt' && !ascending;
			},
			getHref(collectionsPageBaseUrl) {
				const url = new URL(collectionsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'updatedAt');
				url.searchParams.append('ascending', 'false');

				return url.href;
			},
		},
		{
			label: 'First updated at',
			isActive(orderBy, ascending) {
				return orderBy === 'updatedAt' && ascending;
			},
			getHref(collectionsPageBaseUrl) {
				const url = new URL(collectionsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'updatedAt');
				url.searchParams.append('ascending', 'true');

				return url.href;
			},
		},
	],
};
