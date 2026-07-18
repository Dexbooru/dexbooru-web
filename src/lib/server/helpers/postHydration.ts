import type { TPost } from '$lib/shared/types/posts';

export const assignTagAndArtistEntities = (post: TPost) => {
	post.tags = post.tagString
		.split(',')
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0)
		.map((tag) => ({ name: tag }));
	post.artists = post.artistString
		.split(',')
		.map((artist) => artist.trim())
		.filter((artist) => artist.length > 0)
		.map((artist) => ({ name: artist }));
};

export const hydratePostsTagAndArtistEntities = (posts: TPost[]) => {
	posts.forEach(assignTagAndArtistEntities);
};
