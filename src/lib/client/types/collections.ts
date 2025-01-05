import type { TCollectionOrderByColumn } from '$lib/shared/types/collections';

interface TOrderByMapValue {
	label: string;
	// eslint-disable-next-line no-unused-vars
	isActive: (orderBy: TCollectionOrderByColumn, ascending: boolean) => boolean;
	// eslint-disable-next-line no-unused-vars
	getHref: (collectionsPageBaseUrl: string) => string;
}

export type TOrderByTranslationMap = Record<TCollectionOrderByColumn, TOrderByMapValue[]>;
