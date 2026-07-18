import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('$lib/server/aws/actions/s3');

const send = vi.fn();

vi.mock('$lib/server/aws/s3', () => ({
	default: { send },
}));

vi.mock('$lib/server/logging/logger', () => ({
	default: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

describe('s3 upload artifact helpers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('builds temp keys under uploads/{resourceType}/{uploadId}/{index}', async () => {
		const { buildTempUploadObjectKey } = await import('$lib/server/aws/actions/s3');
		expect(buildTempUploadObjectKey('posts', 'abc', 2)).toBe('uploads/posts/abc/2');
		expect(buildTempUploadObjectKey('collections', 'abc', 0)).toBe('uploads/collections/abc/0');
		expect(buildTempUploadObjectKey('user-profiles', 'abc', 1)).toBe('uploads/user-profiles/abc/1');
	});

	it('deletes keys scoped to resourceType and uploadId prefix', async () => {
		send
			.mockResolvedValueOnce({
				Contents: [{ Key: 'uploads/posts/abc/0' }, { Key: 'uploads/posts/abc/1' }],
				IsTruncated: false,
			})
			.mockResolvedValueOnce({});

		const { deleteTempArtifactsByUploadId } = await import('$lib/server/aws/actions/s3');
		const deleted = await deleteTempArtifactsByUploadId('posts', 'abc');

		expect(deleted).toBe(2);
		expect(send).toHaveBeenCalledTimes(2);
		const listCommand = send.mock.calls[0]?.[0] as {
			input: { Prefix: string };
		};
		expect(listCommand.input.Prefix).toBe('uploads/posts/abc/');
		const deleteCommand = send.mock.calls[1]?.[0] as {
			input: { Delete: { Objects: Array<{ Key: string }> } };
		};
		expect(deleteCommand.input.Delete.Objects).toEqual([
			{ Key: 'uploads/posts/abc/0' },
			{ Key: 'uploads/posts/abc/1' },
		]);
	});

	it('extracts full object keys from URLs', async () => {
		const { extractObjectIdFromUrl } = await import('$lib/server/aws/actions/s3');
		expect(
			extractObjectIdFromUrl('http://localhost:4566/dexbooru-dev-posts/posts/uuid_original'),
		).toBe('posts/uuid_original');
		expect(extractObjectIdFromUrl('https://cdn.example/collections/thumb_preview')).toBe(
			'collections/thumb_preview',
		);
	});
});
