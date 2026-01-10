import type { TCommentOrderByTranslationMap } from '$lib/client/types/comments';
import type { TCommentOrderByColumn } from '$lib/shared/types/comments';
import type sanitize from 'sanitize-html';

export const COMMENT_CONTAINER_EMOJI_CHUNK_SIZE = 6;

export const MAXIMUM_COMMENT_REPLY_DEPTH_LOAD = 1;
export const MAXIMUM_COMMENT_REPLY_DEPTH_ABSOLUTE = 10;

export const COMMENT_SANITIZATION_OPTIONS: sanitize.IOptions = {
	allowedTags: [
		'br',
		'p',
		'strong',
		'em',
		'a',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'ul',
		'ol',
		'li',
		'blockquote',
		'code',
		'pre',
	],
	allowedAttributes: {
		a: ['href', 'target'],
	},
};

export const getLabelFromOrderby = (
	orderBy: TCommentOrderByColumn,
	ascending: boolean,
): string | null => {
	const item = ORDER_BY_COMMENT_TRANSLATION_MAP[orderBy][!ascending ? 0 : 1];
	return item.label;
};

export const ORDER_BY_COMMENT_TRANSLATION_MAP: TCommentOrderByTranslationMap = {
	createdAt: [
		{
			label: 'Most recent',
			isActive(orderBy, ascending) {
				return orderBy === 'createdAt' && !ascending;
			},
			getHref(commentsPageBaseUrl) {
				const url = new URL(commentsPageBaseUrl);
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
			getHref(commentsPageBaseUrl) {
				const url = new URL(commentsPageBaseUrl);
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
			getHref(commentsPageBaseUrl) {
				const url = new URL(commentsPageBaseUrl);
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
			getHref(commentsPageBaseUrl) {
				const url = new URL(commentsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'updatedAt');
				url.searchParams.append('ascending', 'true');

				return url.href;
			},
		},
	],
};
