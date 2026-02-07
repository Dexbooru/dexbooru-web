export const getCacheKeyForPendingPosts = (pageNumber: number) => {
	return `pending-posts-${pageNumber}`;
};

export const CACHE_TIME_PENDING_POSTS = 120; // 2 minutes
