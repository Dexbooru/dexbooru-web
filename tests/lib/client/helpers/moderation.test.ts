import { describe, expect, it } from 'vitest';
import { getModerationGridColumnCount } from '$lib/client/helpers/moderation';

describe('getModerationGridColumnCount', () => {
	it('returns 1 column below the sm breakpoint', () => {
		expect(getModerationGridColumnCount(639)).toBe(1);
	});

	it('returns 2 columns from sm to below lg', () => {
		expect(getModerationGridColumnCount(640)).toBe(2);
		expect(getModerationGridColumnCount(1023)).toBe(2);
	});

	it('returns 3 columns from lg to below xl', () => {
		expect(getModerationGridColumnCount(1024)).toBe(3);
		expect(getModerationGridColumnCount(1279)).toBe(3);
	});

	it('returns 4 columns from xl to below 2xl', () => {
		expect(getModerationGridColumnCount(1280)).toBe(4);
		expect(getModerationGridColumnCount(1535)).toBe(4);
	});

	it('returns 5 columns at 2xl and above', () => {
		expect(getModerationGridColumnCount(1536)).toBe(5);
		expect(getModerationGridColumnCount(1920)).toBe(5);
	});
});
