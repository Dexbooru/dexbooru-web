import { vi } from 'vitest';

export const mockPostActions = {
	createPost: vi.fn(),
	deletePostById: vi.fn(),
	findDuplicatePosts: vi.fn(),
	findPostById: vi.fn(),
	findPostsByPage: vi.fn(),
	findPostsByAuthorId: vi.fn(),
	findPostByIdWithUpdatedViewCount: vi.fn(),
	updatePost: vi.fn(),
	hasUserLikedPost: vi.fn(),
	likePostById: vi.fn(),
	findSimilarPosts: vi.fn(),
};

vi.mock('$lib/server/db/actions/post', () => mockPostActions);
