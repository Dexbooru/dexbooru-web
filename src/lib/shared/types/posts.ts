import type { Post, Prisma } from '@prisma/client';
import type { DefaultArgs } from '@prisma/client/runtime/library';

export type TPostLikeAction = 'like' | 'dislike';

export interface ILikePutBody {
	action: TPostLikeAction;
}

export interface IUpdatePostBody {
	description: string;
}

export type THiddenPagePostData = {
	nsfwPosts: TPost[];
	blacklistedPosts: TPost[];
};

export interface IPostPaginationData {
	posts: TPost[];
	likedPosts: TPost[];
	pageNumber: number;
	ascending: boolean;
	orderBy: TPostOrderByColumn;
}

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
export type TPostOrderByColumn = 'likes' | 'createdAt' | 'views' | 'commentCount';
