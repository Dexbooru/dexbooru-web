import { ML_API_URL } from '../constants/urls';
import { buildTagRatingTagString } from '$lib/shared/helpers/tagRating';
import type {
	TagRatingPredictionRequest,
	TagRatingPredictionResponse,
} from '$lib/shared/types/tagRating';

const TAG_RATING_PREDICT_PATH = '/api/tag-rating/predict';

/**
 * POST tag-rating predict (dexbooru-ai). Body matches `TagRatingPredictionRequest`.
 */
export async function predictTagRating(
	body: TagRatingPredictionRequest,
	init?: RequestInit,
): Promise<Response> {
	const url = `${ML_API_URL}${TAG_RATING_PREDICT_PATH}`;
	return await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
		signal: init?.signal,
	});
}

/**
 * Fetches a rating prediction for post tags (space-separated tag string).
 * Returns `null` when there is nothing to send, the request fails, or JSON is invalid.
 */
export async function fetchTagRatingPredictionForTags(
	tags: string[],
	init?: Pick<RequestInit, 'signal'>,
): Promise<TagRatingPredictionResponse | null> {
	try {
		const tag_string = buildTagRatingTagString(tags);
		if (!tag_string) {
			return null;
		}

		const response = await predictTagRating({ tag_string }, init);
		if (!response.ok) {
			return null;
		}

		return (await response.json()) as TagRatingPredictionResponse;
	} catch {
		return null;
	}
}
