import { describe, expect, it } from 'vitest';
import {
	getMediaUploadStrategy,
	mediaUploadStrategies,
} from '$lib/server/uploads/strategies';

describe('media upload strategies', () => {
	it('maps each resource type to the expected preset and emitProgress flag', () => {
		expect(mediaUploadStrategies.posts.transformPreset).toBe('post');
		expect(mediaUploadStrategies.posts.emitProgress).toBe(true);
		expect(mediaUploadStrategies.posts.objectSource).toBe('posts');

		expect(mediaUploadStrategies.collections.transformPreset).toBe('collection');
		expect(mediaUploadStrategies.collections.emitProgress).toBe(false);
		expect(mediaUploadStrategies.collections.objectSource).toBe('collections');

		expect(mediaUploadStrategies['user-profiles'].transformPreset).toBe('profile');
		expect(mediaUploadStrategies['user-profiles'].emitProgress).toBe(false);
		expect(mediaUploadStrategies['user-profiles'].objectSource).toBe('profile_pictures');
	});

	it('returns null for unknown resource types', () => {
		expect(getMediaUploadStrategy('unknown')).toBeNull();
		expect(getMediaUploadStrategy('')).toBeNull();
	});

	it('resolves strategies for valid resource types', () => {
		expect(getMediaUploadStrategy('posts')).toBe(mediaUploadStrategies.posts);
		expect(getMediaUploadStrategy('collections')).toBe(mediaUploadStrategies.collections);
		expect(getMediaUploadStrategy('user-profiles')).toBe(
			mediaUploadStrategies['user-profiles'],
		);
	});
});
