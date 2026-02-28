import { vi } from 'vitest';

export const mockImageHelpers = {
	runDefaultProfilePictureTransformationPipeline: vi.fn(),
	runProfileImageTransformationPipeline: vi.fn(),
};

vi.mock('$lib/server/helpers/images', () => mockImageHelpers);
