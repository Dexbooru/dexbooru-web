import { SAUCENAO_INDEXES_BY_ID } from '../constants/sauceNao';
import type {
	TPostSourceFields,
	TPostSourceOverrides,
	TPostSourceResolution,
	TSauceNaoMatch,
} from '../types/sauceNao';
import { transformLabel } from './labels';

export const isKnownSauceNaoIndexId = (indexId: number) => SAUCENAO_INDEXES_BY_ID.has(indexId);

// The mask spans more than 32 bits, so it is built with BigInt: Number bitwise operators truncate to int32.
export const buildSauceNaoDbMask = (indexIds: readonly number[]): string => {
	let mask = 0n;
	for (const indexId of indexIds) {
		const index = SAUCENAO_INDEXES_BY_ID.get(indexId);
		if (!index) throw new Error(`Unknown SauceNAO index id: ${indexId}`);
		mask |= 1n << BigInt(index.maskBit);
	}
	return mask.toString();
};

// Character and series are taken from the same match so the pair stays coherent.
export const pickSauceNaoPostSource = (
	matches: readonly TSauceNaoMatch[],
): TPostSourceFields | null => {
	const best = matches
		.toSorted((a, b) => b.similarity - a.similarity)
		.find((match) => match.characters.length > 0 && match.series.length > 0);
	if (!best) return null;
	return {
		characterName: transformLabel(best.characters[0]!),
		sourceTitle: transformLabel(best.series[0]!),
		sourceType: SAUCENAO_INDEXES_BY_ID.get(best.indexId)?.sourceType ?? 'OTHER',
	};
};

export const resolvePostSource = (
	overrides: TPostSourceOverrides,
	detected: TPostSourceFields | null,
): TPostSourceResolution => {
	const characterName = overrides.characterName || detected?.characterName;
	const sourceTitle = overrides.sourceTitle || detected?.sourceTitle;
	if (!characterName || !sourceTitle) return { status: 'unknown' };
	const detectedType = detected?.sourceTitle === sourceTitle ? detected.sourceType : undefined;
	return {
		status: 'known',
		characterName,
		sourceTitle,
		sourceType: overrides.sourceType ?? detectedType ?? 'OTHER',
	};
};
