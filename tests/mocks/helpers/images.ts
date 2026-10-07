import { createHash } from 'node:crypto';
import { vi } from 'vitest';

export const mockImageHelpers = {
	hashImageBuffer: vi.fn((buffer: Buffer) => createHash('sha256').update(buffer).digest('hex')),
	transformDefaultProfilePicture: vi.fn(),
	transformProfilePictureFromFile: vi.fn(),
	transformCollectionThumbnailFromFile: vi.fn(),
	transformPostImageFromFile: vi.fn(),
	flattenImageBuffers: vi.fn(),
	hashFile: vi.fn(),
};

vi.mock('$lib/server/helpers/images', () => mockImageHelpers);
