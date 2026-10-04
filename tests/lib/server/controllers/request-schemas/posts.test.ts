import { CreatePostSchema } from '$lib/server/controllers/request-schemas/posts';
import { describe, expect, it } from 'vitest';

const image = new File([Uint8Array.from([1, 2, 3])], 'pic.png', { type: 'image/png' });

const baseForm = {
	sourceLink: 'https://example.com/art',
	description: 'A description',
	postPictures: [image],
	isNsfw: 'false',
	tags: 'solo',
	artists: 'artist',
	ignoreDuplicates: 'false',
};

describe('CreatePostSchema source fields', () => {
	it('turns an empty source field into undefined and normalizes a character name', () => {
		const parsed = CreatePostSchema.form.parse({
			...baseForm,
			characterName: 'Hatsune Miku',
			sourceTitle: '',
			sourceType: '',
		});

		expect(parsed.characterName).toBe('hatsune_miku');
		expect(parsed.sourceTitle).toBeUndefined();
		expect(parsed.sourceType).toBeUndefined();
	});

	it('rejects an invalid source type and accepts a known one', () => {
		const invalid = CreatePostSchema.form.safeParse({
			...baseForm,
			sourceType: 'COMIC',
		});
		const valid = CreatePostSchema.form.safeParse({
			...baseForm,
			sourceType: 'ANIME',
		});

		expect(invalid.success).toBe(false);
		expect(valid.success).toBe(true);
		if (!valid.success) return;
		expect(valid.data.sourceType).toBe('ANIME');
	});
});
