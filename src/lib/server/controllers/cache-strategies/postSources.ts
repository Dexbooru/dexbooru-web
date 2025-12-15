const CACHE_TIME_FOR_POST_SOURCES = 35;

const getCacheKeyForPostSource = (postId: string): string => {
	return `postsources-${postId}`;
};

export { CACHE_TIME_FOR_POST_SOURCES, getCacheKeyForPostSource };
