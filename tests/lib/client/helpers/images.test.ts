import { describe, expect, it } from 'vitest';
import { computeDownScaledImageRatios, transformImageDimensions } from '$lib/client/helpers/images';

describe('computeDownScaledImageRatios', () => {
	it('returns 100 for equal dimensions', () => {
		const dims = [{ imageWidth: 100, imageHeight: 100 }];

		expect(computeDownScaledImageRatios(dims, dims)).toEqual([100]);
	});

	it('returns 100 when comparison dimension is missing', () => {
		const dimsA = [{ imageWidth: 200, imageHeight: 200 }];

		expect(computeDownScaledImageRatios(dimsA, [])).toEqual([100]);
	});

	it('returns 400 when area is 4x larger', () => {
		const dimsA = [{ imageWidth: 200, imageHeight: 200 }];
		const dimsB = [{ imageWidth: 100, imageHeight: 100 }];

		expect(computeDownScaledImageRatios(dimsA, dimsB)).toEqual([400]);
	});
});

describe('transformImageDimensions', () => {
	it('returns unchanged dimensions when screen size is zero', () => {
		expect(transformImageDimensions(800, 600, 0, 1080)).toEqual({
			imageWidth: 800,
			imageHeight: 600,
		});
	});

	it('returns unchanged dimensions when image is below threshold', () => {
		expect(transformImageDimensions(100, 100, 1920, 1080)).toEqual({
			imageWidth: 100,
			imageHeight: 100,
		});
	});

	it('scales down large images', () => {
		const result = transformImageDimensions(4000, 3000, 1920, 1080);

		expect(result.imageWidth).toBeLessThan(4000);
		expect(result.imageHeight).toBeLessThan(3000);
		expect(result.imageWidth).toBeGreaterThan(0);
		expect(result.imageHeight).toBeGreaterThan(0);
	});
});
