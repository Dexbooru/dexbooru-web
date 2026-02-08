import type { TCollectionOrderByColumn } from '$lib/shared/types/collections';

interface TOrderByMapValue {
	label: string;

	isActive: (orderBy: TCollectionOrderByColumn, ascending: boolean) => boolean;

	getHref: (collectionsPageBaseUrl: string) => string;
}

export type TOrderByTranslationMap = Record<TCollectionOrderByColumn, TOrderByMapValue[]>;
