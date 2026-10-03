import { describe, expect, it } from 'vitest';
import { buildSauceNaoDbMask } from '$lib/shared/helpers/sauceNao';

describe('buildSauceNaoDbMask', () => {
	it('sets the documented bit for indexes below the reserved slot', () => {
		expect(buildSauceNaoDbMask([5])).toBe('32');
		expect(buildSauceNaoDbMask([5, 9])).toBe('544');
	});

	it('uses the shifted bit for indexes after reserved index 17', () => {
		expect(buildSauceNaoDbMask([18])).toBe(String(0x20000));
		expect(buildSauceNaoDbMask([25])).toBe(String(0x1000000));
	});

	it('builds masks wider than 32 bits without truncation', () => {
		expect(buildSauceNaoDbMask([41])).toBe('1099511627776');
		expect(buildSauceNaoDbMask([44, 5])).toBe('8796093022240');
	});

	it('returns zero for an empty selection', () => {
		expect(buildSauceNaoDbMask([])).toBe('0');
	});

	it('rejects unknown and reserved index ids', () => {
		expect(() => buildSauceNaoDbMask([17])).toThrow('Unknown SauceNAO index id: 17');
	});
});
