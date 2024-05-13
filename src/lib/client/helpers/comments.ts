import markdownit from 'markdown-it';
import { full as emoji } from 'markdown-it-emoji';
import sanitizeHtml from 'sanitize-html';
import { COMMENT_SANITIZATION_OPTIONS } from '../constants/comments';
import { urlIsImage } from './images';

const markdown = markdownit({
	html: true,
	linkify: true
}).use(emoji);

const processMarkdownHtml = async (html: string): Promise<string> => {
	const parser = new DOMParser();
	const rootElement = parser.parseFromString(html, 'text/html');
	const linkElements = Array.from(rootElement.getElementsByTagName('a'));

	for (const linkElement of linkElements) {
		const href = linkElement.href;
		const isImage = await urlIsImage(href);

		if (isImage) {
			const imageElement = document.createElement('img');
			imageElement.src = href;
			imageElement.setAttribute('class', 'max-w-full h-auto');
			imageElement.setAttribute('width', '200');
			imageElement.setAttribute('height', '200');
			imageElement.setAttribute('style', 'object-fit: contain;');

			linkElement.replaceWith(imageElement);
		} else {
			linkElement.setAttribute(
				'class',
				'inline-flex items-center text-primary-600 hover:underline'
			);
			linkElement.setAttribute('target', '_blank');
			linkElement.setAttribute('rel', 'noopener noreferrer');
		}
	}

	return rootElement.body.innerHTML;
};

export async function convertToMarkdown(rawCommentContent: string): Promise<string> {
	if (rawCommentContent.length === 0) return '';

	const convertedCommentHtml = markdown.render(rawCommentContent.replaceAll('\n', '<br />'));
	const sanitizedCommentHtml = sanitizeHtml(convertedCommentHtml, COMMENT_SANITIZATION_OPTIONS);
	return await processMarkdownHtml(sanitizedCommentHtml);
}
