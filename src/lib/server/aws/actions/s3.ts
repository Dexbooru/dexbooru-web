import { dev } from '$app/environment';
import {
	AWS_LOCAL_COLLECTION_PICTURE_BASE_URL,
	AWS_LOCAL_POSTS_BASE_URL,
	AWS_LOCAL_PROFILE_PICTURE_BASE_URL,
	AWS_LOCAL_UPLOAD_ARTIFACTS_BASE_URL,
	AWS_UPLOAD_ARTIFACTS_BUCKET_NAME,
} from '$lib/server/constants/aws';
import { AWS_CLOUDFRONT_CDN_URL } from '$lib/server/runtimeEnv';
import { UPLOAD_TEMP_KEY_PREFIX } from '$lib/server/constants/upload';
import type { TS3ObjectSource } from '$lib/server/types/aws';
import type { TMediaUploadResourceType } from '$lib/server/types/upload';
import {
	DeleteObjectCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	type DeleteObjectCommandOutput,
} from '@aws-sdk/client-s3';
import logger from '../../logging/logger';
import awsS3 from '../s3';

const getObjectBaseUrl = (objectSource: TS3ObjectSource): string => {
	switch (objectSource) {
		case 'collections':
			return dev ? AWS_LOCAL_COLLECTION_PICTURE_BASE_URL : AWS_CLOUDFRONT_CDN_URL;
		case 'posts':
			return dev ? AWS_LOCAL_POSTS_BASE_URL : AWS_CLOUDFRONT_CDN_URL;
		case 'profile_pictures':
			return dev ? AWS_LOCAL_PROFILE_PICTURE_BASE_URL : AWS_CLOUDFRONT_CDN_URL;
		default:
			return '';
	}
};

const buildObjectId = (objectSource: TS3ObjectSource, objectId: string) => {
	switch (objectSource) {
		case 'collections':
			return `collections/${objectId}`;
		case 'posts':
			return `posts/${objectId}`;
		case 'profile_pictures':
			return `profile-pictures/${objectId}`;
		default:
			return objectId;
	}
};

export const buildObjectUrl = (objectSource: TS3ObjectSource, objectId: string): string => {
	const baseUrl = getObjectBaseUrl(objectSource);
	return `${baseUrl}/${objectId}`;
};

export const extractObjectIdFromUrl = (objectUrl: string): string => {
	const keyedMatch = objectUrl.match(/\/((?:posts|collections|profile-pictures|uploads)\/.+)$/);
	if (keyedMatch?.[1]) {
		return keyedMatch[1];
	}
	const urlSplit = objectUrl.split('/');
	return urlSplit[urlSplit.length - 1] ?? '';
};

export async function uploadToBucket(
	bucketName: string,
	objectSource: TS3ObjectSource,
	fileBuffer: Buffer,
	contentType: string = 'webp',
	overrideObjectId: string = '',
): Promise<string> {
	const baseObjectId = overrideObjectId.length > 0 ? overrideObjectId : crypto.randomUUID();
	const objectId = buildObjectId(objectSource, baseObjectId);
	const uploadParams = {
		Bucket: bucketName,
		Key: objectId,
		Body: fileBuffer,
		ContentType: contentType,
	};

	await awsS3.send(new PutObjectCommand(uploadParams));
	const objectUrl = buildObjectUrl(objectSource, objectId);
	return objectUrl;
}

export async function deleteFromBucket(
	bucketName: string,
	objectUrl: string,
): Promise<DeleteObjectCommandOutput> {
	const objectId = extractObjectIdFromUrl(objectUrl);
	const deleteParams = {
		Bucket: bucketName,
		Key: objectId,
	};

	const bucketResponse = await awsS3.send(new DeleteObjectCommand(deleteParams));
	return bucketResponse;
}

export async function deleteBatchFromBucket(
	bucketName: string,
	objectUrls: string[],
): Promise<DeleteObjectCommandOutput[]> {
	return await Promise.all(objectUrls.map((objectUrl) => deleteFromBucket(bucketName, objectUrl)));
}

export async function uploadBatchToBucket(
	bucketName: string,
	objectSource: TS3ObjectSource,
	fileBuffers: Buffer[],
	contentType: string = 'webp',
	objectIds: string[] = [],
): Promise<string[]> {
	const objectUrls = await Promise.all(
		fileBuffers.map((fileBuffer, index) =>
			uploadToBucket(bucketName, objectSource, fileBuffer, contentType, objectIds[index]),
		),
	);
	return objectUrls;
}

export const buildTempUploadObjectKey = (
	resourceType: TMediaUploadResourceType,
	uploadId: string,
	index: number,
): string => `${UPLOAD_TEMP_KEY_PREFIX}/${resourceType}/${uploadId}/${index}`;

export async function uploadRawToArtifactsBucket(
	objectKey: string,
	fileBuffer: Buffer,
	contentType: string,
): Promise<string> {
	await awsS3.send(
		new PutObjectCommand({
			Bucket: AWS_UPLOAD_ARTIFACTS_BUCKET_NAME,
			Key: objectKey,
			Body: fileBuffer,
			ContentType: contentType,
		}),
	);

	const baseUrl = dev ? AWS_LOCAL_UPLOAD_ARTIFACTS_BASE_URL : AWS_CLOUDFRONT_CDN_URL;
	return `${baseUrl}/${objectKey}`;
}

export async function downloadObjectBuffer(bucketName: string, objectKey: string): Promise<Buffer> {
	const response = await awsS3.send(
		new GetObjectCommand({
			Bucket: bucketName,
			Key: objectKey,
		}),
	);

	const body = response.Body;
	if (!body) {
		throw new Error(`Empty S3 object body for key ${objectKey}`);
	}

	const bytes = await body.transformToByteArray();
	return Buffer.from(bytes);
}

export async function deleteObjectsByKeys(bucketName: string, objectKeys: string[]): Promise<void> {
	const uniqueKeys = [...new Set(objectKeys.filter((key) => key.length > 0))];
	if (uniqueKeys.length === 0) return;

	const chunkSize = 1000;
	for (let i = 0; i < uniqueKeys.length; i += chunkSize) {
		const chunk = uniqueKeys.slice(i, i + chunkSize);
		await awsS3.send(
			new DeleteObjectsCommand({
				Bucket: bucketName,
				Delete: {
					Objects: chunk.map((Key) => ({ Key })),
					Quiet: true,
				},
			}),
		);
	}
}

export async function deleteTempArtifactsByUploadId(
	resourceType: TMediaUploadResourceType,
	uploadId: string,
): Promise<number> {
	const prefix = `${UPLOAD_TEMP_KEY_PREFIX}/${resourceType}/${uploadId}/`;
	const keysToDelete: string[] = [];
	let continuationToken: string | undefined;

	try {
		do {
			const listed = await awsS3.send(
				new ListObjectsV2Command({
					Bucket: AWS_UPLOAD_ARTIFACTS_BUCKET_NAME,
					Prefix: prefix,
					ContinuationToken: continuationToken,
				}),
			);

			for (const object of listed.Contents ?? []) {
				if (object.Key) {
					keysToDelete.push(object.Key);
				}
			}
			continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
		} while (continuationToken);

		await deleteObjectsByKeys(AWS_UPLOAD_ARTIFACTS_BUCKET_NAME, keysToDelete);
		logger.info('Deleted temp upload artifacts', {
			resourceType,
			uploadId,
			deletedCount: keysToDelete.length,
			prefix,
		});
		return keysToDelete.length;
	} catch (error) {
		logger.error('Failed to delete temp upload artifacts', {
			resourceType,
			uploadId,
			prefix,
			error,
		});
		return 0;
	}
}
