import { vi } from 'vitest';

export const mockS3Actions = {
	uploadToBucket: vi.fn(),
	deleteFromBucket: vi.fn(),
	deleteBatchFromBucket: vi.fn(),
	uploadBatchToBucket: vi.fn(),
	buildObjectUrl: vi.fn(),
	extractObjectIdFromUrl: vi.fn(),
	buildTempUploadObjectKey: vi.fn(
		(resourceType: string, uploadId: string, index: number) =>
			`uploads/${resourceType}/${uploadId}/${index}`,
	),
	uploadRawToArtifactsBucket: vi.fn(),
	downloadObjectBuffer: vi.fn(),
	deleteObjectsByKeys: vi.fn(),
	deleteTempArtifactsByUploadId: vi.fn(),
};

vi.mock('$lib/server/aws/actions/s3', () => mockS3Actions);
