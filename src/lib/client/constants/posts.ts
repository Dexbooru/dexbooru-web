import type { TOrderByTranslationMap } from '../types/posts';

export const ORDER_BY_TRANSLATION_MAP: TOrderByTranslationMap = {
	createdAt: [
		{
			label: 'Most recent',
			isActive(orderBy, ascending) {
				return orderBy === 'createdAt' && !ascending;
			},
			getHref(postsPageBaseUrl) {
				const url = new URL(postsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'createdAt');
				url.searchParams.append('ascending', 'false');

				return url.href;
			}
		},
		{
			label: 'Least recent',
			isActive(orderBy, ascending) {
				return orderBy === 'createdAt' && ascending;
			},
			getHref(postsPageBaseUrl) {
				const url = new URL(postsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'createdAt');
				url.searchParams.append('ascending', 'true');

				return url.href;
			}
		}
	],
	likes: [
		{
			label: 'Most liked',
			isActive(orderBy, ascending) {
				return orderBy === 'likes' && !ascending;
			},
			getHref(postsPageBaseUrl) {
				const url = new URL(postsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'likes');
				url.searchParams.append('ascending', 'false');

				return url.href;
			}
		},
		{
			label: 'Least liked',
			isActive(orderBy, ascending) {
				return orderBy === 'likes' && ascending;
			},
			getHref(postsPageBaseUrl) {
				const url = new URL(postsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'likes');
				url.searchParams.append('ascending', 'true');

				return url.href;
			}
		}
	]
};
