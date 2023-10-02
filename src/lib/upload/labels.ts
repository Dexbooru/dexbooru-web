import { isStringAppropriate } from '$lib/helpers/strings';

const MAXIMUM_TAG_LENGTH = 30;
const MAXIMUM_ARTIST_LENGTH = 30;
const MAXIMUM_DESCRIPTION_LENGTH = 500;
const SEPERATOR_CHARACTER = '-';

export const isTagValid = (tag: string): boolean => {
	if (tag.length <= 0 || tag.length > MAXIMUM_TAG_LENGTH) return false;
	if (!isStringAppropriate(tag)) return false;
	if (tag.includes(SEPERATOR_CHARACTER)) return false;

	return true;
};

export const isArtistValid = (artist: string): boolean => {
	if (artist.length <= 0 || artist.length > MAXIMUM_ARTIST_LENGTH) return false;
	if (!isStringAppropriate(artist)) return false;
	if (artist.includes(SEPERATOR_CHARACTER)) return false;

	return true;
};

export const isValidDescription = (description: string): boolean => {
	if (description.length <= 0 || description.length > MAXIMUM_DESCRIPTION_LENGTH) return false;
	if (!isStringAppropriate(description)) return false;

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
