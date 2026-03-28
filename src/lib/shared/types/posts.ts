import type {
	Post,
	PostModerationStatus,
	PostSourceType,
	Prisma,
	UserRole,
} from '$generated/prisma/client';
import type { DefaultArgs } from '@prisma/client/runtime/client';
import type { TComment } from './comments';

export type TPostLikeAction = 'like' | 'dislike';

export type TLikePutBody = {
	action: TPostLikeAction;
};

export type TPostSource = {
	id: string;
	postId: string;
	sourceTitle: string;
	sourceType: PostSourceType;
	characterName: string;
};

export type TPostSourceInput = Omit<TPostSource, 'id'>;

export type TUpdatePostBody = {
	description: string;
	sourceLink: string;
	deletionPostImageUrls: string[];
	newPostImagesContent: string[];
};

export type THiddenPagePostData = {
	nsfwPosts: TPost[];
	blacklistedPosts: TPost[];
};

export type TPostPaginationData = {
	posts: TPost[];
	pageNumber: number;
	ascending: boolean;
	orderBy: TPostOrderByColumn;
};

export type TPost = Post & {
	id: string;
	sourceLink: string;
	isNsfw: boolean;
	description: string;
	createdAt: Date;
	updatedAt: Date;
	imageUrls: string[];
	imageWidths: number[];
	imageHeights: number[];
	likes: number;
	author: {
		id: string;
		username: string;
		profilePictureUrl: string;
		role: UserRole;
	};
	tagString: string;
	tags: {
		id?: string;
		name: string;
		postCount?: number;
	}[];
	artists: {
		id?: string;
		name: string;
		postCount?: number;
	}[];
	artistString: string;
	commentCount: number;
	moderationStatus: PostModerationStatus;
	comments: TComment[];
	sources: TPostSource[];
};

export type TPostDuplicate = Pick<TPost, 'id' | 'imageUrls' | 'description'>;

export type TPostSourceSelector = Prisma.PostSourceSelect<DefaultArgs>;
export type TPostSelector = Prisma.PostSelect<DefaultArgs>;
export type TPostOrderByColumn = 'likes' | 'createdAt' | 'views' | 'commentCount' | 'updatedAt';

export type {
	PostImageSimilarityResult,
	PostImageSimilaritySearchResponse,
} from './postImageSimilarity';

export type TPostDraft = {
	isNsfw: boolean;
	tags: string[];
	artists: string[];
	description: string;
	sourceLink: string;
};
