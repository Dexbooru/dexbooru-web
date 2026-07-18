import { vi } from 'vitest';

export const mockImageHelpers = {
	transformDefaultProfilePicture: vi.fn(),
	transformProfilePictureFromFile: vi.fn(),
	transformCollectionThumbnailFromFile: vi.fn(),
	transformPostImageFromFile: vi.fn(),
	flattenImageBuffers: vi.fn(),
	hashFile: vi.fn(),
};

vi.mock('$lib/server/helpers/images', () => mockImageHelpers);
