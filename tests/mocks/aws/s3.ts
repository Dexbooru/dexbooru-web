import { vi } from 'vitest';

export const mockS3Actions = {
	uploadToBucket: vi.fn(),
	deleteFromBucket: vi.fn(),
	deleteBatchFromBucket: vi.fn(),
	uploadBatchToBucket: vi.fn(),
};

vi.mock('$lib/server/aws/actions/s3', () => mockS3Actions);
