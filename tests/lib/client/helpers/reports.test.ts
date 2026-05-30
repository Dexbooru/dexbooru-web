import { describe, expect, it } from 'vitest';
import { normalizeReportReasonName } from '$lib/client/helpers/reports';

describe('normalizeReportReasonName', () => {
	it('replaces underscores with spaces and capitalizes', () => {
		expect(normalizeReportReasonName('spam_content')).toBe('Spam content');
	});

	it('capitalizes single-word categories', () => {
		expect(normalizeReportReasonName('harassment')).toBe('Harassment');
	});

	it('handles multiple underscores', () => {
		expect(normalizeReportReasonName('fake_account_impersonation')).toBe(
			'Fake account impersonation',
		);
	});
});
