import { fetchTagRatingPredictionForTags, predictTagRating } from '$lib/client/api/mlApi';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/client/constants/urls', () => ({
	ML_API_URL: 'https://ml.example',
}));

describe('mlApi tag rating', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('fetchTagRatingPredictionForTags returns null without calling fetch when there are no tags', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
		const result = await fetchTagRatingPredictionForTags([]);
		expect(result).toBeNull();
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('predictTagRating posts TagRatingPredictionRequest JSON', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

		await predictTagRating({ tag_string: 'solo cat' });

		expect(fetchSpy).toHaveBeenCalledWith(
			'https://ml.example/api/tag-rating/predict',
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tag_string: 'solo cat' }),
			}),
		);
	});

	it('fetchTagRatingPredictionForTags parses TagRatingPredictionResponse', async () => {
		const payload = {
			transformed_input: 'cat solo',
			predicted_class: 's',
			class_probabilities_percent: { s: 70, q: 20, e: 10 },
		};
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify(payload), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		const result = await fetchTagRatingPredictionForTags(['solo', 'cat']);
		expect(result).toEqual(payload);
	});

	it('fetchTagRatingPredictionForTags returns null on non-OK response', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 400 }));
		const result = await fetchTagRatingPredictionForTags(['a']);
		expect(result).toBeNull();
	});
});
