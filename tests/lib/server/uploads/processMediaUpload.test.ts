import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockS3Actions } from '../../../mocks/aws/s3';
import { mockUploadStatus } from '../../../mocks/events/uploadStatus';
import { mockMediaUploadsPublish } from '../../../mocks/rabbitmq/publishers/mediaUploads';

vi.mock('$lib/server/uploads/uploadQueueLedger', () => ({
	enqueueUploadQueue: vi.fn().mockResolvedValue(undefined),
	leaveUploadQueue: vi.fn().mockResolvedValue(undefined),
}));

describe('processMediaUpload', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { mockImageHelpers } = await import('../../../mocks/helpers/images');
		mockImageHelpers.hashFile.mockResolvedValue('sha256-hash');
		mockS3Actions.uploadRawToArtifactsBucket.mockResolvedValue('http://example/temp');
		mockS3Actions.deleteTempArtifactsByUploadId.mockResolvedValue(1);
		mockUploadStatus.waitForUploadCompletion.mockResolvedValue({
			imageUrls: ['https://cdn.example/image'],
			imageWidths: [100],
			imageHeights: [80],
			imageHashes: ['sha256-hash'],
		});
	});

	it('emits progress when emitProgress is true', async () => {
		const { processMediaUpload } = await import('$lib/server/uploads/processMediaUpload');
		const file = new File([Buffer.from('png')], 'a.png', { type: 'image/png' });

		await processMediaUpload({
			resourceType: 'posts',
			files: [file],
			isNsfw: false,
			uploadId: 'upload-posts',
			emitProgress: true,
		});

		expect(mockUploadStatus.emitUploadProgress).toHaveBeenCalled();
		expect(mockMediaUploadsPublish).toHaveBeenCalledWith(
			'media_uploads',
			expect.objectContaining({
				uploadId: 'upload-posts',
				resourceType: 'posts',
				images: [
					expect.objectContaining({
						tempObjectKey: 'uploads/posts/upload-posts/0',
					}),
				],
			}),
		);
	});

	it('does not emit progress when emitProgress is false', async () => {
		const { processMediaUpload } = await import('$lib/server/uploads/processMediaUpload');
		const file = new File([Buffer.from('png')], 'a.png', { type: 'image/png' });

		await processMediaUpload({
			resourceType: 'collections',
			files: [file],
			isNsfw: true,
			uploadId: 'upload-collections',
			emitProgress: false,
		});

		expect(mockUploadStatus.emitUploadProgress).not.toHaveBeenCalled();
		expect(mockMediaUploadsPublish).toHaveBeenCalledWith(
			'media_uploads',
			expect.objectContaining({
				uploadId: 'upload-collections',
				resourceType: 'collections',
			}),
		);
		expect(mockS3Actions.deleteTempArtifactsByUploadId).toHaveBeenCalledWith(
			'collections',
			'upload-collections',
		);
	});
});
