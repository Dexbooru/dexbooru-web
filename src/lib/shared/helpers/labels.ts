import {
	MAXIMUM_COLLECTION_DESCRIPTION_LENGTH,
	MAXIMUM_COLLECTION_TITLE_LENGTH,
} from '../constants/collections';
import {
	BLACKLISTED_LABELS,
	LABEL_REGEX,
	MAXIMUM_ARTIST_LENGTH,
	MAXIMUM_TAG_LENGTH,
	SEPERATOR_CHARACTER_MAP,
} from '../constants/labels';
import { MAXIMUM_POST_DESCRIPTION_LENGTH } from '../constants/posts';
import type { TPost } from '../types/posts';

export const isLabelAppropriate = (
	label: string,
	labelType: 'tag' | 'artist' | 'postDescription' | 'collectionDescription' | 'collectionTitle',
): boolean => {
	if (labelType === 'tag' && (label.length === 0 || label.length > MAXIMUM_TAG_LENGTH))
		return false;
	if (labelType === 'artist' && (label.length === 0 || label.length > MAXIMUM_ARTIST_LENGTH))
		return false;
	if (
		labelType === 'postDescription' &&
		(label.length === 0 || label.length > MAXIMUM_POST_DESCRIPTION_LENGTH)
	)
		return false;
	if (
		labelType === 'collectionDescription' &&
		(label.length === 0 || label.length > MAXIMUM_COLLECTION_DESCRIPTION_LENGTH)
	)
		return false;
	if (
		labelType === 'collectionTitle' &&
		(label.length === 0 || label.length > MAXIMUM_COLLECTION_TITLE_LENGTH)
	)
		return false;
	if (
		!['postDescription', 'collectionDescription', 'collectionTitle'].includes(labelType) &&
		!LABEL_REGEX.test(label)
	)
		return false;

	return !BLACKLISTED_LABELS.some((blackListedString) => label.includes(blackListedString));
};

export const transformLabel = (label: string): string => {
	let transformedLabel = label.trim().toLocaleLowerCase();
	for (const [key, value] of Object.entries(SEPERATOR_CHARACTER_MAP)) {
		transformedLabel = transformedLabel.replaceAll(key, value);
	}
	return transformedLabel;
};

export const transformLabels = (labels: string | string[] | undefined): string[] => {
	if (typeof labels === 'string' && labels.length === 0) return [];

	const convertedLabels: string[] =
		labels === undefined ? [] : typeof labels === 'string' ? labels.split(',') : labels;
	return Array.from(new Set(convertedLabels.map(transformLabel)));
};

export const getUniqueLabelsFromPosts = (posts: TPost[], labelType: 'tag' | 'artist'): string[] => {
	const allLabels = posts.map((post) => {
		return labelType === 'tag'
			? post.tags.map((tag) => tag.name)
			: post.artists.map((artist) => artist.name);
	});
	const allLabelsFlattened = allLabels.flat();

	return [...new Set(allLabelsFlattened)];
};
