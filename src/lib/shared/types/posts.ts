import type { Post, Prisma } from '@prisma/client';
import type { DefaultArgs } from '@prisma/client/runtime/library';

export type TPostLikeAction = 'like' | 'dislike';

export interface IDeletePostBody {
	postId: string;
	authorId: string;
}

export interface ILikePostBody {
	postId: string;
	action: TPostLikeAction;
}

export interface IPostPaginationData {
	posts: IPost[];
	likedPosts: IPost[];
	pageNumber: number;
	ascending: boolean;
	orderBy: TPostOrderByColumn;
}

export type IPost = Post & {
	id: string;
	description: string;
	createdAt: Date;
	imageUrls: string[];
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
};

export type TPostSelector = Prisma.PostSelect<DefaultArgs>;
export type TPostOrderByColumn = 'likes' | 'createdAt' | 'views';
