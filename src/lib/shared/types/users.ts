import type { User } from '@prisma/client';
import type { IPost } from './posts';

export type IUser = User & {
	likedPosts: IPost[];
	createdPosts: IPost[];
};
