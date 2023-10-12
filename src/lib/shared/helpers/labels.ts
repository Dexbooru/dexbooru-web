import {
	BLACKLISTED_LABELS,
	MAXIMUM_ARTIST_LENGTH,
	MAXIMUM_DESCRIPTION_LENGTH,
	MAXIMUM_TAG_LENGTH,
	SEPERATOR_CHARACTER
} from '../constants/labels';

export const isLabelAppropriate = (label: string): boolean => {
	return !BLACKLISTED_LABELS.some((blackListedString) => label.includes(blackListedString));
};

export const isTagValid = (tag: string): boolean => {
	if (tag.length <= 0 || tag.length > MAXIMUM_TAG_LENGTH) return false;
	if (!isLabelAppropriate(tag)) return false;
	if (tag.includes(SEPERATOR_CHARACTER)) return false;

	return true;
};

export const isArtistValid = (artist: string): boolean => {
	if (artist.length <= 0 || artist.length > MAXIMUM_ARTIST_LENGTH) return false;
	if (!isLabelAppropriate(artist)) return false;
	if (artist.includes(SEPERATOR_CHARACTER)) return false;

	return true;
};

export const isValidDescription = (description: string): boolean => {
	if (description.length <= 0 || description.length > MAXIMUM_DESCRIPTION_LENGTH) return false;
	if (!isLabelAppropriate(description)) return false;

	return true;
};

export const transformLabel = (label: string): string => {
	return label.trim().toLowerCase().replace(SEPERATOR_CHARACTER, ' ');
};

export const transformLabels = (labels: string | string[] | undefined): string[] => {
	const convertedLabels: string[] =
		labels === undefined ? [] : typeof labels === 'string' ? JSON.parse(labels) : labels;
	return Array.from(new Set(convertedLabels.map(transformLabel)));
};
