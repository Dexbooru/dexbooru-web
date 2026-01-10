import type { Artist, Tag } from '$generated/prisma/client';

type TAnalyticsData = {
	topTags: Tag[];
	topArtists: Artist[];
};

export type { TAnalyticsData };
