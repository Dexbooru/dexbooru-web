import { describe, expect, it } from 'vitest';
import { getCommentNotificationPreview } from '$lib/client/notifications/notificationHelpers';
import {
	COMMENT_CONTENT_PREVIEW_ELLIPSIS,
	COMMENT_CONTENT_PREVIEW_LENGTH,
} from '$lib/shared/constants/comments';

describe('getCommentNotificationPreview', () => {
	it('returns plain text for short comments', () => {
		expect(getCommentNotificationPreview('<p>Hello world</p>')).toBe('Hello world');
	});

	it('truncates long comments with the preview ellipsis constant', () => {
		const longText = 'a'.repeat(COMMENT_CONTENT_PREVIEW_LENGTH + 40);
		const preview = getCommentNotificationPreview(`<p>${longText}</p>`);

		expect(preview.endsWith(COMMENT_CONTENT_PREVIEW_ELLIPSIS)).toBe(true);
		expect(preview.length).toBe(
			COMMENT_CONTENT_PREVIEW_LENGTH + COMMENT_CONTENT_PREVIEW_ELLIPSIS.length,
		);
		expect(preview.slice(0, COMMENT_CONTENT_PREVIEW_LENGTH)).toBe(
			'a'.repeat(COMMENT_CONTENT_PREVIEW_LENGTH),
		);
	});
});
