export const MAXIMUM_RENDERABLE_TAGS = 15;
export const MAXIMUM_RENDERABLE_ARTISTS = 15;

export const ESTIMATED_TAG_RATING_LABEL_MAP: Record<'q' | 'e' | 's', string> = {
	q: 'Questionable',
	e: 'Explicit',
	s: 'Safe',
};

export const CHAR_OPTIONS_UPPERCASE = [
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z',
];
export const CHAR_OPTIONS_LOWERCASE = CHAR_OPTIONS_UPPERCASE.map((char) =>
	char.toLocaleLowerCase(),
);
