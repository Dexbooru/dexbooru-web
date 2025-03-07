import { dev } from '$app/environment';
import {
	AWS_CLOUDFRONT_COLLECTION_PICTURE_BASE_URL,
	AWS_CLOUDFRONT_POSTS_BASE_URL,
	AWS_CLOUDFRONT_PROFILE_PICTURE_BASE_URL,
} from '$env/static/private';
import {
	AWS_LOCAL_COLLECTION_PICTURE_BASE_URL,
	AWS_LOCAL_POSTS_BASE_URL,
	AWS_LOCAL_PROFILE_PICTURE_BASE_URL,
} from '$lib/server/constants/aws';
import type { TS3ObjectSource } from '$lib/server/types/aws';
import {
	DeleteObjectCommand,
	PutObjectCommand,
	type DeleteObjectCommandOutput,
} from '@aws-sdk/client-s3';
import awsS3 from '../s3';

const getObjectBaseUrl = (objectSource: TS3ObjectSource): string => {
	switch (objectSource) {
		case 'collections':
			return dev
				? AWS_LOCAL_COLLECTION_PICTURE_BASE_URL
				: AWS_CLOUDFRONT_COLLECTION_PICTURE_BASE_URL;
		case 'posts':
			return dev ? AWS_LOCAL_POSTS_BASE_URL : AWS_CLOUDFRONT_POSTS_BASE_URL;
		case 'profile_pictures':
			return dev ? AWS_LOCAL_PROFILE_PICTURE_BASE_URL : AWS_CLOUDFRONT_PROFILE_PICTURE_BASE_URL;
		default:
			return '';
	}
};

export const buildObjectUrl = (objectSource: TS3ObjectSource, objectId: string): string => {
	const baseUrl = getObjectBaseUrl(objectSource);
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
	contentType: string = 'webp',
	overrideObjectId: string = '',
): Promise<string> {
	const objectId = overrideObjectId.length > 0 ? overrideObjectId : crypto.randomUUID();
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
	const objectId = extractOjbectIdFromUrl(objectUrl);
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
	objectSources: TS3ObjectSource,
	fileBuffers: Buffer[],
	contentType: string = 'webp',
	objectIds: string[] = [],
): Promise<string[]> {
	const objectUrls = await Promise.all(
		fileBuffers.map((fileBuffer, index) =>
			uploadToBucket(bucketName, objectSources, fileBuffer, contentType, objectIds[index]),
		),
	);
	return objectUrls;
}
