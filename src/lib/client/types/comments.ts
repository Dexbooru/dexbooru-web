import type { TCommentOrderByColumn } from '$lib/shared/types/comments';

interface TOrderByMapValue {
	label: string;
	isActive: (_orderBy: TCommentOrderByColumn, _ascending: boolean) => boolean;
	getHref: (_commentsPageBaseUrl: string) => string;
}

export type TCommentOrderByTranslationMap = Record<TCommentOrderByColumn, TOrderByMapValue[]>;
