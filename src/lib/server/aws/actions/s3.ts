import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import awsS3 from '../s3';
import type { TS3ObjectSource } from '$lib/server/types/aws';

export const buildObjectUrl = (objectSource: TS3ObjectSource, objectId: string): string => {
	const baseUrl =
		objectSource === 'profile_pictures'
			? process.env.AWS_CLOUDFRONT_PROFILE_PICTURE_BASE_URL
			: process.env.AWS_CLOUDFRONT_POSTS_BASE_URL;
	return `${baseUrl}/${objectId}`;
};

export const extractOjbectIdFromUrl = (objectUrl: string): string => {
	const urlSplit = objectUrl.split('/');
	return urlSplit[urlSplit.length - 1];
};

export async function uploadToBucket(
	bucketName: string,
	objectSource: TS3ObjectSource,
	fileBuffer: Buffer,
	contentType: string = 'webp'
): Promise<string> {
	const objectId = crypto.randomUUID();
	const uploadParams = {
		Bucket: bucketName,
		Key: objectId,
		Body: fileBuffer,
		ContentType: contentType
	};

	await awsS3.send(new PutObjectCommand(uploadParams));
	const objectUrl = buildObjectUrl(objectSource, objectId);
	return objectUrl;
}

export async function deleteFromBucket(bucketName: string, objectUrl: string): Promise<void> {
	const objectId = extractOjbectIdFromUrl(objectUrl);
	const deleteParams = {
		Bucket: bucketName,
		Key: objectId
	};

	await awsS3.send(new DeleteObjectCommand(deleteParams));
}

export async function deleteBatchFromBucket(
	bucketName: string,
	objectUrls: string[]
): Promise<void> {
	await Promise.all(objectUrls.map((objectUrl) => deleteFromBucket(bucketName, objectUrl)));
}

export async function uploadBatchToBucket(
	bucketName: string,
	objectSources: TS3ObjectSource,
	fileBuffers: Buffer[],
	contentType: string = 'webp'
): Promise<string[]> {
	const objectUrls = await Promise.all(
		fileBuffers.map((fileBuffer) =>
			uploadToBucket(bucketName, objectSources, fileBuffer, contentType)
		)
	);
	return objectUrls;
}
