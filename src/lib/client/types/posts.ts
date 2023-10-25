import type { TPostOrderByColumn } from '$lib/shared/types/posts';

interface TOrderByMapValue {
	label: string;
	isActive: (orderBy: TPostOrderByColumn, ascending: boolean) => boolean;
	getHref: (postsPageBaseUrl: string) => string;
}

export type TOrderByTranslationMap = Record<TPostOrderByColumn, TOrderByMapValue[]>;
