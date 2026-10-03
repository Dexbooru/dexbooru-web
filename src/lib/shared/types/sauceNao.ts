export type TSauceNaoIndex = {
	id: number;
	maskBit: number;
	name: string;
};

export type TSauceNaoMatch = {
	indexId: number;
	indexName: string;
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
