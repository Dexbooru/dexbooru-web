import type { TagRatingClassId } from '$lib/shared/types/tagRating';

export const TAG_RATING_CLASS_LABELS: Record<TagRatingClassId, string> = {
	s: 'Safe',
	q: 'Questionable',
	e: 'Explicit',
};
