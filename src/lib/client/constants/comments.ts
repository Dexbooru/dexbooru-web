import sanitize from 'sanitize-html';

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
		'pre'
	],
	allowedAttributes: {
		a: ['href', 'target']
	}
};
