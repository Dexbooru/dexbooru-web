import {
	BLACKLISTED_LABELS,
	LABEL_REGEX,
	MAXIMUM_ARTIST_LENGTH,
	MAXIMUM_DESCRIPTION_LENGTH,
	MAXIMUM_TAG_LENGTH,
	SEPERATOR_CHARACTER_MAP,
} from '../constants/labels';
import type { TPost } from '../types/posts';

export const isLabelAppropriate = (
	label: string,
	labelType: 'tag' | 'artist' | 'description',
): boolean => {
	if (labelType === 'tag' && (label.length === 0 || label.length > MAXIMUM_TAG_LENGTH))
		return false;
	if (labelType === 'artist' && (label.length === 0 || label.length > MAXIMUM_ARTIST_LENGTH))
		return false;
	if (
		labelType === 'description' &&
		(label.length === 0 || label.length > MAXIMUM_DESCRIPTION_LENGTH)
	)
		return false;

	if (labelType !== 'description' && !LABEL_REGEX.test(label)) return false;

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
