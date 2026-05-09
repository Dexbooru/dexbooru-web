import type { TComment, TCommentOrderByColumn } from '$lib/shared/types/comments';

/** JSON body from `GET /api/comments/{commentId}` success responses. */
export type TCommentChainApiResponse = {
	data?: {
		commentChain?: TComment[];
	};
};

interface TOrderByMapValue {
	label: string;
	isActive: (_orderBy: TCommentOrderByColumn, _ascending: boolean) => boolean;
	getHref: (_commentsPageBaseUrl: string) => string;
}

export type TCommentOrderByTranslationMap = Record<TCommentOrderByColumn, TOrderByMapValue[]>;
