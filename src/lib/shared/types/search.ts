import type { Artist, Tag } from '@prisma/client';

export type TSearchSection = 'posts' | 'tags' | 'artists' | 'users' | 'all';

export type TAppSearchParams = {
	query: string;
	searchSection?: TSearchSection;
	limit?: number;
};

export type TAppSearchResult = {
	posts?: TPostSearchResults;
	users?: TUserSearchResults;
	tags?: Tag[];
	artists?: Artist[];
	collections?: TPostCollectionSearchResults;
};

export type TPostCollectionSearchResults = {
	id: string;
	title: string;
	description: string;
	createdAt: Date;
	uploaderName: string;
	uploaderProfilePictureUrl: string;
}[];

export type TPostSearchResults = {
	id: string;
	description: string;
	createdAt: Date;
	uploaderName: string;
	uploaderProfilePictureUrl: string;
}[];

export type TUserSearchResults = {
	id: string;
	createdAt: Date;
	username: string;
	profilePictureUrl: string;
}[];
