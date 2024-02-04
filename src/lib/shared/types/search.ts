import type { Artist, Tag } from '@prisma/client';

export type TSearchSection = 'posts' | 'tags' | 'artists' | 'users' | 'all';

export interface IAppSearchParams {
	query: string;
	searchSection?: TSearchSection;
	limit?: number;
}

export interface IAppSearchResult {
	posts?: TPostSearchResults;
	users?: TUserSearchResults;
	tags?: Tag[];
	artists?: Artist[];
}

export type TPostSearchResults = {
	id: string;
	description: string;
	createdAt: Date;
}[];

export type TUserSearchResults = {
	id: string;
	createdAt: Date;
	username: string;
	profilePictureUrl: string;
}[];
