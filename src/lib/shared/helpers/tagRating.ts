import { TAG_RATING_CLASS_LABELS } from '$lib/shared/constants/tagRating';
import type { TagRatingClassId, TagRatingPredictionResponse } from '$lib/shared/types/tagRating';

const NORMALIZED_ALIASES: Record<string, TagRatingClassId> = {
	s: 's',
	safe: 's',
	general: 's',
	q: 'q',
	questionable: 'q',
	e: 'e',
	explicit: 'e',
};

/**
 * Maps API / model class strings to s | q | e when recognizable (case-insensitive).
 */
export function normalizeTagRatingClass(predictedClass: string): TagRatingClassId | null {
	const key = predictedClass.trim().toLowerCase();
	return NORMALIZED_ALIASES[key] ?? null;
}

export function isExplicitTagRating(predictedClass: string): boolean {
	return normalizeTagRatingClass(predictedClass) === 'e';
}

export function isQuestionableTagRating(predictedClass: string): boolean {
	return normalizeTagRatingClass(predictedClass) === 'q';
}

export function isSafeTagRating(predictedClass: string): boolean {
	return normalizeTagRatingClass(predictedClass) === 's';
}

/** Questionable or explicit — appropriate for auto-marking post NSFW from ML tag rating. */
export function isNsfwTagRating(predictedClass: string): boolean {
	const id = normalizeTagRatingClass(predictedClass);
	return id === 'q' || id === 'e';
}

/** Danbooru-style tag string for the predictor (space-separated). */
export function buildTagRatingTagString(tags: string[]): string {
	return tags
		.map((t) => t.trim())
		.filter(Boolean)
		.join(' ');
}

export function getPredictedClassProbability(response: TagRatingPredictionResponse): number | null {
	const raw = response.class_probabilities_percent[response.predicted_class];
	if (typeof raw === 'number' && !Number.isNaN(raw)) {
		return raw;
	}
	return null;
}

/** Sorted descending by probability for display. */
export function sortRatingProbabilities(
	percentMap: Record<string, number>,
): { className: string; percent: number }[] {
	return Object.entries(percentMap)
		.map(([className, percent]) => ({ className, percent }))
		.sort((a, b) => b.percent - a.percent);
}

export function tagRatingClassDisplayLabel(predictedClass: string): string {
	const id = normalizeTagRatingClass(predictedClass);
	if (id) return TAG_RATING_CLASS_LABELS[id];
	return predictedClass;
}
