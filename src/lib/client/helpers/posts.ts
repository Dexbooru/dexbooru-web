import type { TPost, TPostOrderByColumn, TPostPaginationData } from '$lib/shared/types/posts';
import { get } from 'svelte/store';
import { ORDER_BY_TRANSLATION_MAP } from '../constants/posts';
import {
	getAuthenticatedUserPreferences,
	getBlacklistedPostPage,
	getHiddenPostsPage,
	getNsfwPostPage,
	getOriginalPostsPage,
	getPostsPage,
} from '../helpers/context';
import { getPostPaginationData } from './context';

export function normalizeCount(count: number): string {
	if (count >= 1000000) {
		return (count / 1000000).toFixed(1) + 'M';
	}

	if (count >= 1000) {
		return (count / 1000).toFixed(1) + 'K';
	}

	return count.toString();
}

export function formatNumberWithCommas(target: number): string {
	return target.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function roundNumber(target: number, places: number = 0) {
	return Number(target.toFixed(places));
}

export const generatePostWrapperMetaTags = (
	postsSection: string,
	pageNumber: number,
	ascending: boolean,
	orderBy: TPostOrderByColumn,
	posts: TPost[],
) => {
	const title = `${postsSection} - Page ${pageNumber + 1}`;
	let description = '';

	const orderTranslationOptions = ORDER_BY_TRANSLATION_MAP[orderBy];
	const matchingOrderTranslationOption = orderTranslationOptions.find((translationOption) =>
		translationOption.isActive(orderBy, ascending),
	);
	if (matchingOrderTranslationOption) {
		description = `${posts.length} post(s) sorted by the ${matchingOrderTranslationOption.label} criterion`;
	}

	return { title, description };
};

export const updatePostStores = (updatePostPaginationData: TPostPaginationData) => {
	const userPreferences = get(getAuthenticatedUserPreferences());
	const { blacklistedArtists, blacklistedTags, browseInSafeMode } = userPreferences;

	const nsfwPosts: TPost[] = [];
	const blacklistedPosts: TPost[] = [];
	const displayPosts: TPost[] = [];
	for (const post of updatePostPaginationData.posts) {
		const containsBlacklistedTag = post.tags.some((tag) => blacklistedTags.includes(tag.name));
		const containsBlacklistedArtist = post.artists.some((artist) =>
			blacklistedArtists.includes(artist.name),
		);

		const canDisplayPost: boolean[] = [];
		if (!containsBlacklistedArtist && !containsBlacklistedTag) {
			canDisplayPost.push(true);
		} else {
			blacklistedPosts.push(post);
			canDisplayPost.push(false);
		}

		if (browseInSafeMode && post.isNsfw) {
			nsfwPosts.push(post);
			canDisplayPost.push(false);
		} else {
			canDisplayPost.push(true);
		}

		if (canDisplayPost.every((canDisplay) => canDisplay)) {
			displayPosts.push(post);
		}
	}

	const postPaginationData = getPostPaginationData();
	const postsPage = getPostsPage();
	const originalPostsPage = getOriginalPostsPage();
	const blacklistedPostsPage = getBlacklistedPostPage();
	const nsfwPostsPage = getNsfwPostPage();
	const hiddenPostsPage = getHiddenPostsPage();

	postPaginationData.set(updatePostPaginationData);
	postsPage.set(displayPosts);
	originalPostsPage.set(displayPosts);
	blacklistedPostsPage.set(blacklistedPosts);
	nsfwPostsPage.set(nsfwPosts);
	hiddenPostsPage.set({
		nsfwPosts,
		blacklistedPosts,
	});
};
