import type { IPostPaginationData, TPost } from '$lib/shared/types/posts';
import { get } from 'svelte/store';
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

export const updatePostStores = (updatePostPaginationData: IPostPaginationData) => {
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

		let canDisplayPost = false;
		if (!containsBlacklistedArtist && !containsBlacklistedTag) {
			canDisplayPost = true;
		} else {
			blacklistedPosts.push(post);
			canDisplayPost = false;
		}

		if (browseInSafeMode && post.isNsfw) {
			nsfwPosts.push(post);
			canDisplayPost = false;
		} else {
			canDisplayPost = true;
		}

		if (canDisplayPost) {
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
