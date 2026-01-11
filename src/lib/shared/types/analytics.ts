import type { Artist, Tag } from '$generated/prisma/client';
import type { TPost } from './posts';

type TAnalyticsData = {
	topTags: Tag[];
	topArtists: Artist[];
	topLikedPosts: TPost[];
	topViewedPosts: TPost[];
};

export type { TAnalyticsData };
