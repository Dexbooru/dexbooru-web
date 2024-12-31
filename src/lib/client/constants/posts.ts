import { page } from '$app/state';
import type { TPostOrderByColumn } from '$lib/shared/types/posts';
import { quintOut } from 'svelte/easing';
import { scale } from 'svelte/transition';
import type { TOrderByTranslationMap } from '../types/posts';

export const getLabelFromOrderby = (
	orderBy: TPostOrderByColumn,
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
			getHref(postsPageBaseUrl) {
				const url = new URL(postsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'createdAt');
				url.searchParams.append('ascending', 'false');
				if (page.url.pathname === '/search') {
					url.searchParams.append('query', page.url.searchParams.get('query') ?? '');
				}

				return url.href;
			},
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
				if (page.url.pathname === '/search') {
					url.searchParams.append('query', page.url.searchParams.get('query') ?? '');
				}

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
			getHref(postsPageBaseUrl) {
				const url = new URL(postsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'updatedAt');
				url.searchParams.append('ascending', 'false');
				if (page.url.pathname === '/search') {
					url.searchParams.append('query', page.url.searchParams.get('query') ?? '');
				}

				return url.href;
			},
		},
		{
			label: 'First updated at',
			isActive(orderBy, ascending) {
				return orderBy === 'updatedAt' && ascending;
			},
			getHref(postsPageBaseUrl) {
				const url = new URL(postsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'updatedAt');
				url.searchParams.append('ascending', 'true');
				if (page.url.pathname === '/search') {
					url.searchParams.append('query', page.url.searchParams.get('query') ?? '');
				}

				return url.href;
			},
		},
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
				if (page.url.pathname === '/search') {
					url.searchParams.append('query', page.url.searchParams.get('query') ?? '');
				}

				return url.href;
			},
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
				if (page.url.pathname === '/search') {
					url.searchParams.append('query', page.url.searchParams.get('query') ?? '');
				}

				return url.href;
			},
		},
	],
	views: [
		{
			label: 'Most viewed',
			isActive(orderBy, ascending) {
				return orderBy === 'views' && !ascending;
			},
			getHref(postsPageBaseUrl) {
				const url = new URL(postsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'views');
				url.searchParams.append('ascending', 'false');
				if (page.url.pathname === '/search') {
					url.searchParams.append('query', page.url.searchParams.get('query') ?? '');
				}

				return url.href;
			},
		},
		{
			label: 'Least viewed',
			isActive(orderBy, ascending) {
				return orderBy === 'views' && ascending;
			},
			getHref(postsPageBaseUrl) {
				const url = new URL(postsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'views');
				url.searchParams.append('ascending', 'true');
				if (page.url.pathname === '/search') {
					url.searchParams.append('query', page.url.searchParams.get('query') ?? '');
				}

				return url.href;
			},
		},
	],
	commentCount: [
		{
			label: 'Most commented',
			isActive(orderBy, ascending) {
				return orderBy === 'commentCount' && !ascending;
			},
			getHref(postsPageBaseUrl) {
				const url = new URL(postsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'commentCount');
				url.searchParams.append('ascending', 'false');
				if (page.url.pathname === '/search') {
					url.searchParams.append('query', page.url.searchParams.get('query') ?? '');
				}

				return url.href;
			},
		},
		{
			label: 'Least commented',
			isActive(orderBy, ascending) {
				return orderBy === 'commentCount' && ascending;
			},
			getHref(postsPageBaseUrl) {
				const url = new URL(postsPageBaseUrl);
				url.searchParams.append('pageNumber', '0');
				url.searchParams.append('orderBy', 'commentCount');
				url.searchParams.append('ascending', 'true');
				if (page.url.pathname === '/search') {
					url.searchParams.append('query', page.url.searchParams.get('query') ?? '');
				}

				return url.href;
			},
		},
	],
};

export const POSTS_GRID_ANIMATION_DURATION_MS = 500;
export const POST_CARD_CAROUSEL_SLIDE_DURATION = 350;
export const POST_CARD_CAROUSEL_TRANSITION_FUNCTION = (x: Element) =>
	scale(x, { duration: POSTS_GRID_ANIMATION_DURATION_MS, easing: quintOut });

export const INDIVIDUAL_POST_PATH_REGEX = new RegExp(
	'^/posts/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
);
