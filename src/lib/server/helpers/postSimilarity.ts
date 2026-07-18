import type { Prisma } from '$generated/prisma/client';
import type {
	TSimilarityFeatures,
	TSimilarityPreferences,
	TSimilarityRawCandidate,
	TSimilarityScoredCandidate,
	TSimilarityScoreBreakdown,
	TSimilaritySeed,
	TSimilaritySourceFields,
} from '$lib/server/types/postSimilarity';

export const POST_SIMILARITY_WEIGHTS = {
	artist: 0.55,
	source: 0.3,
	tag: 0.15,
} as const;
export const POST_SIMILARITY_MINIMUM_SCORE_THRESHOLD = 0.65;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const normalizeToken = (value: string) => value.trim().toLowerCase();

const buildSet = (tokens: string[]) =>
	new Set(tokens.map(normalizeToken).filter((token) => token.length > 0));

const jaccard = (left: Set<string>, right: Set<string>) => {
	if (left.size === 0 || right.size === 0) {
		return 0;
	}

	let intersectionCount = 0;
	left.forEach((token) => {
		if (right.has(token)) {
			intersectionCount += 1;
		}
	});

	const unionSize = left.size + right.size - intersectionCount;
	if (unionSize === 0) {
		return 0;
	}

	return intersectionCount / unionSize;
};

const buildSourceSets = (sources: TSimilaritySourceFields[]) => {
	return {
		titles: buildSet(sources.map((source) => source.sourceTitle)),
		characters: buildSet(sources.map((source) => source.characterName)),
		types: buildSet(sources.map((source) => source.sourceType)),
	};
};

const computeSourceOverlap = (
	targetSources: TSimilaritySourceFields[],
	candidateSources: TSimilaritySourceFields[],
) => {
	const targetSets = buildSourceSets(targetSources);
	const candidateSets = buildSourceSets(candidateSources);

	const overlaps: number[] = [];
	if (targetSets.titles.size > 0) {
		overlaps.push(jaccard(targetSets.titles, candidateSets.titles));
	}
	if (targetSets.characters.size > 0) {
		overlaps.push(jaccard(targetSets.characters, candidateSets.characters));
	}
	if (targetSets.types.size > 0) {
		overlaps.push(jaccard(targetSets.types, candidateSets.types));
	}

	if (overlaps.length === 0) {
		return 0;
	}

	const overlapSum = overlaps.reduce((accumulator, value) => accumulator + value, 0);
	return overlapSum / overlaps.length;
};

export const normalizeCommaSeparatedValues = (value: string) =>
	Array.from(buildSet(value.split(',')));

export const shouldSkipSimilarityForSafeMode = (isNsfwTarget: boolean, browseInSafeMode: boolean) =>
	isNsfwTarget && browseInSafeMode;

const normalizeValuesForFilter = (values: string[]) =>
	values.map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0);

export const buildSimilaritySeed = (
	tagString: string,
	artistString: string,
	sources: TSimilaritySourceFields[],
): TSimilaritySeed => {
	const sourceTitles = Array.from(
		new Set(
			sources
				.map((source) => source.sourceTitle.trim().toLowerCase())
				.filter((sourceTitle) => sourceTitle.length > 0),
		),
	);
	const characterNames = Array.from(
		new Set(
			sources
				.map((source) => source.characterName.trim().toLowerCase())
				.filter((characterName) => characterName.length > 0),
		),
	);
	const sourceTypes = Array.from(
		new Set(sources.map((source) => source.sourceType).filter((sourceType) => !!sourceType)),
	);

	return {
		tags: normalizeCommaSeparatedValues(tagString),
		artists: normalizeCommaSeparatedValues(artistString),
		sourceTitles,
		characterNames,
		sourceTypes,
	};
};

export const isSimilaritySeedEmpty = (seed: TSimilaritySeed) =>
	seed.tags.length === 0 &&
	seed.artists.length === 0 &&
	seed.sourceTitles.length === 0 &&
	seed.characterNames.length === 0 &&
	seed.sourceTypes.length === 0;

export const buildSimilarityWhereInput = (params: {
	postId: string;
	isNsfw: boolean;
	seed: TSimilaritySeed;
	preferences: TSimilarityPreferences;
}): Prisma.PostWhereInput => {
	const { postId, isNsfw, seed, preferences } = params;

	const orStatements: Prisma.PostWhereInput['OR'] = [];
	if (seed.tags.length > 0) {
		orStatements.push({
			tags: {
				some: {
					name: {
						in: seed.tags,
					},
				},
			},
		});
	}
	if (seed.artists.length > 0) {
		orStatements.push({
			artists: {
				some: {
					name: {
						in: seed.artists,
					},
				},
			},
		});
	}
	if (seed.sourceTitles.length > 0) {
		orStatements.push({
			sources: {
				some: {
					sourceTitle: {
						in: seed.sourceTitles,
						mode: 'insensitive',
					},
				},
			},
		});
	}
	if (seed.characterNames.length > 0) {
		orStatements.push({
			sources: {
				some: {
					characterName: {
						in: seed.characterNames,
						mode: 'insensitive',
					},
				},
			},
		});
	}
	if (seed.sourceTypes.length > 0) {
		orStatements.push({
			sources: {
				some: {
					sourceType: {
						in: seed.sourceTypes,
					},
				},
			},
		});
	}

	const blacklistTags = normalizeValuesForFilter(preferences.blacklistedTags);
	const blacklistArtists = normalizeValuesForFilter(preferences.blacklistedArtists);

	const notStatements: Prisma.PostWhereInput[] = [];
	if (blacklistTags.length > 0) {
		notStatements.push({
			tags: {
				some: {
					name: {
						in: blacklistTags,
						mode: 'insensitive',
					},
				},
			},
		});
	}
	if (blacklistArtists.length > 0) {
		notStatements.push({
			artists: {
				some: {
					name: {
						in: blacklistArtists,
						mode: 'insensitive',
					},
				},
			},
		});
	}

	return {
		moderationStatus: { in: ['PENDING', 'APPROVED'] },
		isNsfw,
		id: {
			not: postId,
		},
		OR: orStatements,
		NOT: notStatements,
	};
};

export const computeSimilarityScore = (
	target: TSimilarityFeatures,
	candidate: TSimilarityFeatures,
): TSimilarityScoreBreakdown => {
	const artistOverlap = jaccard(buildSet(target.artists), buildSet(candidate.artists));
	const tagOverlap = jaccard(buildSet(target.tags), buildSet(candidate.tags));
	const sourceOverlap = computeSourceOverlap(target.sources, candidate.sources);

	let weightSum = 0;
	let weightedScore = 0;

	if (target.artists.length > 0) {
		weightSum += POST_SIMILARITY_WEIGHTS.artist;
		weightedScore += artistOverlap * POST_SIMILARITY_WEIGHTS.artist;
	}
	if (target.sources.length > 0) {
		weightSum += POST_SIMILARITY_WEIGHTS.source;
		weightedScore += sourceOverlap * POST_SIMILARITY_WEIGHTS.source;
	}
	if (target.tags.length > 0) {
		weightSum += POST_SIMILARITY_WEIGHTS.tag;
		weightedScore += tagOverlap * POST_SIMILARITY_WEIGHTS.tag;
	}

	const score = weightSum > 0 ? clamp01(weightedScore / weightSum) : 0;

	return {
		score,
		artistOverlap: clamp01(artistOverlap),
		sourceOverlap: clamp01(sourceOverlap),
		tagOverlap: clamp01(tagOverlap),
	};
};

export const rankSimilarityCandidates = (candidates: TSimilarityScoredCandidate[]) => {
	return candidates.toSorted((left, right) => {
		if (right.score !== left.score) {
			return right.score - left.score;
		}
		return right.createdAt.getTime() - left.createdAt.getTime();
	});
};

export const scoreAndRankSimilarityCandidates = (
	target: TSimilarityFeatures,
	candidates: TSimilarityRawCandidate[],
	limit: number,
) => {
	const similarityMap: Record<string, number> = {};
	const scoredCandidates = candidates
		.map((candidate) => {
			const score = computeSimilarityScore(target, {
				tags: normalizeCommaSeparatedValues(candidate.tagString),
				artists: normalizeCommaSeparatedValues(candidate.artistString),
				sources: candidate.sources,
			}).score;
			similarityMap[candidate.id] = score;

			return {
				id: candidate.id,
				score,
				createdAt: candidate.createdAt,
			};
		})
		.filter((candidate) => candidate.score >= POST_SIMILARITY_MINIMUM_SCORE_THRESHOLD);

	const sortedIds = rankSimilarityCandidates(scoredCandidates)
		.slice(0, limit)
		.map((candidate) => candidate.id);

	return {
		sortedIds,
		similarityMap,
	};
};
