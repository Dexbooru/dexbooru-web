/**
 * Contract for POST /api/tag-rating/predict (dexbooru-ai `tag_rating_controller`).
 */
export type TagRatingPredictionRequest = {
	tag_string: string;
};

export type TagRatingPredictionResponse = {
	transformed_input: string;
	predicted_class: string;
	class_probabilities_percent: Record<string, number>;
};

/** Typical Danbooru-style rating labels from the classifier; API may return other strings. */
export type TagRatingClassId = 's' | 'q' | 'e';
