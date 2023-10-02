const BLACKLISTED_STRINGS = ['loli', 'shota', 'nigga', 'nigger'];

export const isStringAppropriate = (string: string): boolean => {
	return !BLACKLISTED_STRINGS.some((blackListedString) => string.includes(blackListedString));
};
