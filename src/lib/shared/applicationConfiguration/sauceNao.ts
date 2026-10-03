import { isKnownSauceNaoIndexId } from '../helpers/sauceNao';

export const SAUCE_NAO_MINIMUM_SIMILARITY_LOWER_BOUND = 1;
export const SAUCE_NAO_MINIMUM_SIMILARITY_UPPER_BOUND = 100;

export const normalizeSauceNaoEnabledIndexIds = (indexIds: readonly number[]): number[] => {
	const seen = new Set<number>();
	const normalized: number[] = [];
	for (const indexId of indexIds) {
		if (!isKnownSauceNaoIndexId(indexId)) {
			throw new Error(`Unknown SauceNAO index id: ${indexId}`);
		}
		if (seen.has(indexId)) continue;
		seen.add(indexId);
		normalized.push(indexId);
	}
	return normalized;
};
