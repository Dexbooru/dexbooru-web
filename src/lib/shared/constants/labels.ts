export const MAXIMUM_TAG_LENGTH = 30;
export const MAXIMUM_ARTIST_LENGTH = 30;
export const MAXIMUM_TAGS_PER_POST = 20;
export const MAXIMUM_ARTISTS_PER_POST = 5;
export const MAXIMUM_DESCRIPTION_LENGTH = 500;
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
