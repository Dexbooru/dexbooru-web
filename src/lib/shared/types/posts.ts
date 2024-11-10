import type { Post, Prisma } from '@prisma/client';
import type { DefaultArgs } from '@prisma/client/runtime/library';

export type TPostLikeAction = 'like' | 'dislike';

export type TLikePutBody = {
	action: TPostLikeAction;
};

export type TUpdatePostBody = {
	description: string;
};

export type THiddenPagePostData = {
	nsfwPosts: TPost[];
	blacklistedPosts: TPost[];
};

export type TPostPaginationData = {
	posts: TPost[];
	likedPosts: TPost[];
	pageNumber: number;
	ascending: boolean;
	orderBy: TPostOrderByColumn;
	postCount: number;
};

export type TPost = Post & {
	id: string;
	isNsfw: boolean;
	description: string;
	createdAt: Date;
	imageUrls: string[];
	imageWidths: number[];
	imageHeights: number[];
	likes: number;
	author: {
		id: string;
		username: string;
		profilePictureUrl: string;
	};
	tags: {
		name: string;
	}[];
	artists: {
		name: string;
	}[];
	commentCount: number;
};

export type TPostSelector = Prisma.PostSelect<DefaultArgs>;
export type TPostOrderByColumn = 'likes' | 'createdAt' | 'views' | 'commentCount' | 'updatedAt';

export type TPostSimilarityBody = {
	image_url?: string;
	image_file?: string;
	k?: number;
};

export type TPostImageSimilarityResult = {
	post_id: string;
	distance: number;
	image_url: string;
};

export type TPostSimilarityResponse = {
	status: string;
	results: TPostImageSimilarityResult[];
};
