import { SAUCENAO_INDEXES_BY_ID } from '../constants/sauceNao';

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
