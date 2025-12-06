import type sanitize from 'sanitize-html';

export const COMMENT_CONTAINER_EMOJI_CHUNK_SIZE = 6;

export const MAXIMUM_COMMENT_REPLY_DEPTH_LOAD = 1;
export const MAXIMUM_COMMENT_REPLY_DEPTH_ABSOLUTE = 10;

export const COMMENT_SANITIZATION_OPTIONS: sanitize.IOptions = {
	allowedTags: [
		'br',
		'p',
		'strong',
		'em',
		'a',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'ul',
		'ol',
		'li',
		'blockquote',
		'code',
		'pre',
	],
	allowedAttributes: {
		a: ['href', 'target'],
	},
};
