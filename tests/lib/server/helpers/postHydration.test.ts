import { describe, expect, it } from 'vitest';
import type { TPost } from '$lib/shared/types/posts';
import {
	assignTagAndArtistEntities,
	hydratePostsTagAndArtistEntities,
} from '$lib/server/helpers/postHydration';

describe('postHydration', () => {
	it('splits and trims tag/artist strings into entity arrays', () => {
		const post = {
			tagString: ' tag-a , tag-b , ',
			artistString: ' artist-a,artist-b ',
		} as TPost;

		assignTagAndArtistEntities(post);

		expect(post.tags).toEqual([{ name: 'tag-a' }, { name: 'tag-b' }]);
		expect(post.artists).toEqual([{ name: 'artist-a' }, { name: 'artist-b' }]);
	});

	it('hydrates a list of posts in place', () => {
		const posts = [
			{ tagString: 'a', artistString: 'b' },
			{ tagString: 'c', artistString: 'd' },
		] as TPost[];

		hydratePostsTagAndArtistEntities(posts);

		expect(posts[0]?.tags).toEqual([{ name: 'a' }]);
		expect(posts[1]?.artists).toEqual([{ name: 'd' }]);
	});
});
