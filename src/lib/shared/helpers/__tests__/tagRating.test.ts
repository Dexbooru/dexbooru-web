import { describe, expect, it } from 'vitest';
import {
	buildTagRatingTagString,
	getPredictedClassProbability,
	isExplicitTagRating,
	isNsfwTagRating,
	isQuestionableTagRating,
	isSafeTagRating,
	normalizeTagRatingClass,
	sortRatingProbabilities,
} from '../tagRating';
import type { TagRatingPredictionResponse } from '$lib/shared/types/tagRating';

describe('tagRating helpers', () => {
	describe('normalizeTagRatingClass', () => {
		it('maps s / safe / general', () => {
			expect(normalizeTagRatingClass('s')).toBe('s');
			expect(normalizeTagRatingClass('Safe')).toBe('s');
			expect(normalizeTagRatingClass('general')).toBe('s');
		});
		it('maps q / questionable', () => {
			expect(normalizeTagRatingClass('q')).toBe('q');
			expect(normalizeTagRatingClass('Questionable')).toBe('q');
		});
		it('maps e / explicit', () => {
			expect(normalizeTagRatingClass('e')).toBe('e');
			expect(normalizeTagRatingClass('EXPLICIT')).toBe('e');
		});
		it('returns null for unknown', () => {
			expect(normalizeTagRatingClass('unknown')).toBeNull();
		});
	});

	describe('isExplicitTagRating / isQuestionableTagRating / isSafeTagRating', () => {
		it('detects explicit', () => {
			expect(isExplicitTagRating('e')).toBe(true);
			expect(isExplicitTagRating('s')).toBe(false);
		});
		it('detects questionable', () => {
			expect(isQuestionableTagRating('q')).toBe(true);
			expect(isQuestionableTagRating('e')).toBe(false);
		});
		it('detects safe', () => {
			expect(isSafeTagRating('s')).toBe(true);
			expect(isSafeTagRating('q')).toBe(false);
		});
	});

	describe('isNsfwTagRating', () => {
		it('is true for questionable and explicit', () => {
			expect(isNsfwTagRating('q')).toBe(true);
			expect(isNsfwTagRating('questionable')).toBe(true);
			expect(isNsfwTagRating('e')).toBe(true);
			expect(isNsfwTagRating('explicit')).toBe(true);
		});
		it('is false for safe and unknown', () => {
			expect(isNsfwTagRating('s')).toBe(false);
			expect(isNsfwTagRating('safe')).toBe(false);
			expect(isNsfwTagRating('weird')).toBe(false);
		});
	});

	describe('buildTagRatingTagString', () => {
		it('joins trimmed tags with spaces', () => {
			expect(buildTagRatingTagString(['a', ' b ', '', 'c'])).toBe('a b c');
		});
		it('returns empty string when no tags', () => {
			expect(buildTagRatingTagString([])).toBe('');
		});
	});

	describe('getPredictedClassProbability', () => {
		it('returns probability for predicted_class key', () => {
			const res: TagRatingPredictionResponse = {
				transformed_input: 'x',
				predicted_class: 's',
				class_probabilities_percent: { s: 90, q: 8, e: 2 },
			};
			expect(getPredictedClassProbability(res)).toBe(90);
		});
		it('returns null when missing', () => {
			const res: TagRatingPredictionResponse = {
				transformed_input: 'x',
				predicted_class: 's',
				class_probabilities_percent: { q: 100 },
			};
			expect(getPredictedClassProbability(res)).toBeNull();
		});
	});

	describe('sortRatingProbabilities', () => {
		it('sorts by percent descending', () => {
			expect(sortRatingProbabilities({ s: 10, e: 50, q: 40 }).map((x) => x.className)).toEqual([
				'e',
				'q',
				's',
			]);
		});
	});
});
