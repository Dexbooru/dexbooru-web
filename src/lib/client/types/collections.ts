import type { TCollectionOrderByColumn } from '$lib/shared/types/collections';
import type { TPostOrderByColumn } from '$lib/shared/types/posts';

interface TOrderByMapValue {
	label: string;
	// eslint-disable-next-line no-unused-vars
	isActive: (orderBy: TPostOrderByColumn, ascending: boolean) => boolean;
	// eslint-disable-next-line no-unused-vars
	getHref: (collectionsPageBaseUrl: string) => string;
}

export type TOrderByTranslationMap = Record<TCollectionOrderByColumn, TOrderByMapValue[]>;
