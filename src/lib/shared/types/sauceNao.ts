import type { POST_SOURCE_TYPES } from '../constants/posts';

export type TPostSourceType = (typeof POST_SOURCE_TYPES)[number];

export type TSauceNaoIndex = {
	id: number;
	maskBit: number;
	name: string;
	available: boolean;
	enabled: boolean;
	sourceType: TPostSourceType | null;
};

export type TPostSourceFields = {
	characterName: string;
	sourceTitle: string;
	sourceType: TPostSourceType;
};

export type TPostSourceOverrides = {
	characterName?: string;
	sourceTitle?: string;
	sourceType?: TPostSourceType;
};

export type TPostSourceResolution =
	({ status: 'known' } & TPostSourceFields) | { status: 'unknown' };

export type TSauceNaoMatch = {
	indexId: number;
	indexName: string;
	sourceType: TPostSourceType | null;
	similarity: number;
	thumbnailUrl: string;
	title: string | null;
	sourceUrls: string[];
	artists: string[];
	characters: string[];
	series: string[];
};

export type TSauceNaoImageSuggestions = {
	matches: TSauceNaoMatch[];
	artists: string[];
	characters: string[];
	series: string[];
	sourceUrls: string[];
};

export type TSauceNaoSuggestionsResponse =
	| { status: 'disabled' }
	| { status: 'rate_limited' }
	| { status: 'ok'; suggestions: TSauceNaoImageSuggestions };
