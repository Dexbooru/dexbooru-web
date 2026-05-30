import { describe, expect, it } from 'vitest';
import { htmlToMarkdown } from '$lib/client/helpers/comments';

describe('htmlToMarkdown', () => {
	it('converts strong tags to markdown bold', () => {
		expect(htmlToMarkdown('<strong>foo</strong>')).toBe('**foo**');
	});

	it('converts paragraph tags to plain text', () => {
		expect(htmlToMarkdown('<p>hello</p>')).toBe('hello');
	});

	it('converts links to markdown links', () => {
		expect(htmlToMarkdown('<a href="https://example.com">link</a>')).toBe(
			'[link](https://example.com)',
		);
	});
});
