export const MAXIMUM_TAG_LENGTH = 75;
export const MAXIMUM_ARTIST_LENGTH = 75;

export const SEPERATOR_CHARACTER_MAP: Record<string, string> = {
	'-': '',
	' ': '_',
	',': '',
};
export const SEPERATOR_CHARACTER_UI = [
	'Comma characters in the tags or artists will be replaced entirely',
	'Spaces in the tags or artists will be replaced with underscores entirely',
	'Dash characters in the tags or artists will be replaced entirely',
	'All tags and artist labels must be lowercase',
];

export const BLACKLISTED_LABELS = ['loli', 'lolicon', 'shota', 'shotcon', 'nigga', 'nigger'];
export const LABEL_REGEX = /^[a-z0-9!@#$%^&*()_+={}\\[\]:;"'<>,.?\\/\\|`~]*$/;

export const MAXIMUM_LABELS_ON_POST_CARD = 15;
