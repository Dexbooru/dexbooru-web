import type { PostSourceType } from '$generated/prisma/client';

export type TSimilaritySourceFields = {
	sourceType: PostSourceType;
	sourceTitle: string;
	characterName: string;
};

export type TSimilarityPreferences = {
	browseInSafeMode: boolean;
	blacklistedTags: string[];
	blacklistedArtists: string[];
};

export type TSimilaritySeed = {
	tags: string[];
	artists: string[];
	sourceTitles: string[];
	characterNames: string[];
	sourceTypes: PostSourceType[];
};

export type TSimilarityFeatures = {
	tags: string[];
	artists: string[];
	sources: TSimilaritySourceFields[];
};

export type TSimilarityScoredCandidate = {
	id: string;
	score: number;
	createdAt: Date;
};

export type TSimilarityRawCandidate = {
	id: string;
	tagString: string;
	artistString: string;
	createdAt: Date;
	sources: TSimilaritySourceFields[];
};

export type TSimilarityScoreBreakdown = {
	score: number;
	artistOverlap: number;
	sourceOverlap: number;
	tagOverlap: number;
};
