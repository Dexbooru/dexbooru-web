import type { TCollectionPaginationData, TPostCollection } from '$lib/shared/types/collections';
import { get } from 'svelte/store';
import {
	getAuthenticatedUserPreferences,
	getCollectionPage,
	getCollectionPaginationData,
	getHiddenCollectionsPage,
	getNsfwCollectionPage,
	getOriginalCollectionPage,
} from './context';

export const generateCollectionWrapperMetadata = (
	pageNumber: number,
	collections: TPostCollection[],
) => {
	const title = `Collections - Page ${pageNumber + 1}`;
	const description = `${collections.length} post(s) sorted by the Most recent criterion`;

	return { title, description };
};

export const updateCollectionStores = (
	updateCollectionPaginationData: TCollectionPaginationData,
) => {
	const userPreferences = get(getAuthenticatedUserPreferences());
	const { browseInSafeMode } = userPreferences;

	const nsfwCollections: TPostCollection[] = [];
	const displayCollections: TPostCollection[] = [];
	for (const collection of updateCollectionPaginationData.collections) {
		let canDisplayPost = false;

		if (browseInSafeMode && collection.isNsfw) {
			nsfwCollections.push(collection);
			canDisplayPost = false;
		} else {
			canDisplayPost = true;
		}

		if (canDisplayPost) {
			displayCollections.push(collection);
		}
	}

	const collectionPaginationData = getCollectionPaginationData();
	const collectionsPage = getCollectionPage();
	const originalCollectionsPage = getOriginalCollectionPage();
	const nsfwCollectionsPage = getNsfwCollectionPage();
	const hiddenCollectionsPage = getHiddenCollectionsPage();

	collectionPaginationData.set(updateCollectionPaginationData);
	collectionsPage.set(displayCollections);
	originalCollectionsPage.set(displayCollections);
	nsfwCollectionsPage.set(nsfwCollections);
	hiddenCollectionsPage.set({
		nsfwCollections: nsfwCollections,
	});
};
