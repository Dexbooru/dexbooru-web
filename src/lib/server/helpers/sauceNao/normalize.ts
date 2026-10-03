import { SAUCENAO_INDEXES_BY_ID } from '$lib/shared/constants/sauceNao';
import type { TSauceNaoImageSuggestions, TSauceNaoMatch } from '$lib/shared/types/sauceNao';
import type { TSauceNaoResult } from './schema';

type TListField = {
	fields: readonly string[];
	splitCommas: boolean;
};

const LIST_FIELDS = {
	artists: {
		fields: [
			'creator',
			'member_name',
			'author_name',
			'artist',
			'user_name',
			'twitter_user_handle',
			'creator_name',
		],
		splitCommas: true,
	},
	characters: {
		fields: ['characters'],
		splitCommas: true,
	},
	series: {
		fields: ['material'],
		splitCommas: true,
	},
} as const satisfies Record<string, TListField>;

const TITLE_FIELDS = ['title', 'eng_name', 'jp_name'] as const;

const appendValues = (value: unknown, splitCommas: boolean, into: string[]) => {
	if (typeof value === 'string') {
		const pieces = splitCommas ? value.split(',') : [value];
		for (const piece of pieces) {
			const trimmed = piece.trim();
			if (trimmed.length > 0) into.push(trimmed);
		}
		return;
	}
	if (Array.isArray(value)) {
		for (const entry of value) appendValues(entry, splitCommas, into);
	}
};

const collectFields = (data: Record<string, unknown>, spec: TListField) => {
	const values: string[] = [];
	for (const field of spec.fields) {
		appendValues(data[field], spec.splitCommas, values);
	}
	return values;
};

const isHttpUrl = (value: string) => {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
};

// Booru posts use the tag "original" when the work has no series.
const isDroppedSeries = (value: string) => value.toLowerCase() === 'original';

const consumeSource = (value: unknown, series: string[], sourceUrls: string[]) => {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (trimmed.length === 0) return;
		if (isHttpUrl(trimmed)) {
			sourceUrls.push(trimmed);
			return;
		}
		appendValues(trimmed, true, series);
		return;
	}
	if (Array.isArray(value)) {
		for (const entry of value) consumeSource(entry, series, sourceUrls);
	}
};

const readTitle = (data: Record<string, unknown>) => {
	for (const field of TITLE_FIELDS) {
		const values: string[] = [];
		appendValues(data[field], false, values);
		const title = values[0];
		if (title) return title;
	}
	return null;
};

export const normalizeSauceNaoResult = (result: TSauceNaoResult): TSauceNaoMatch => {
	const artists = collectFields(result.data, LIST_FIELDS.artists);
	const characters = collectFields(result.data, LIST_FIELDS.characters);
	const series = collectFields(result.data, LIST_FIELDS.series);
	const sourceUrls: string[] = [];
	appendValues(result.data.ext_urls, false, sourceUrls);
	consumeSource(result.data.source, series, sourceUrls);

	const index = SAUCENAO_INDEXES_BY_ID.get(result.header.index_id);
	const similarity = Number.parseFloat(result.header.similarity);
	return {
		indexId: result.header.index_id,
		indexName: index?.name ?? result.header.index_name,
		similarity: Number.isFinite(similarity) ? similarity : 0,
		thumbnailUrl: result.header.thumbnail,
		title: readTitle(result.data),
		sourceUrls,
		artists,
		characters,
		series: series.filter((value) => !isDroppedSeries(value)),
	};
};

export const normalizeSauceNaoResults = (results: readonly TSauceNaoResult[]): TSauceNaoMatch[] =>
	results.map(normalizeSauceNaoResult);

type TRankedName = {
	name: string;
	score: number;
	order: number;
};

const rankNames = (
	matches: readonly TSauceNaoMatch[],
	pick: (match: TSauceNaoMatch) => string[],
) => {
	const ranked = new Map<string, TRankedName>();
	let order = 0;
	for (const match of matches) {
		const seenInMatch = new Set<string>();
		for (const name of pick(match)) {
			const key = name.toLowerCase();
			if (seenInMatch.has(key)) continue;
			seenInMatch.add(key);
			const existing = ranked.get(key);
			if (existing) {
				existing.score += match.similarity;
				continue;
			}
			ranked.set(key, { name, score: match.similarity, order });
			order += 1;
		}
	}

	return [...ranked.values()]
		.sort((left, right) => right.score - left.score || left.order - right.order)
		.map((entry) => entry.name);
};

export const aggregateSauceNaoSuggestions = (
	matches: readonly TSauceNaoMatch[],
	minimumSimilarity: number,
): TSauceNaoImageSuggestions => {
	const qualifying = matches
		.filter((match) => match.similarity >= minimumSimilarity)
		.toSorted((a, b) => b.similarity - a.similarity);
	return {
		matches: qualifying,
		artists: rankNames(qualifying, (match) => match.artists),
		characters: rankNames(qualifying, (match) => match.characters),
		series: rankNames(qualifying, (match) => match.series),
		sourceUrls: rankNames(qualifying, (match) => match.sourceUrls),
	};
};
