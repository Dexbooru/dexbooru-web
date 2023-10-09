import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import awsS3 from '../s3';

export const buildObjectUrl = (bucketName: string, objectId: string): string => {
	return `https://${bucketName}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${objectId}`;
};

export const extractOjbectIdFromUrl = (objectUrl: string): string => {
	const urlSplit = objectUrl.split('/');
	return urlSplit[urlSplit.length - 1];
};

export async function uploadToBucket(
	bucketName: string,
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
	const objectUrl = buildObjectUrl(bucketName, objectId);
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
	fileBuffers: Buffer[],
	contentType: string = 'webp'
): Promise<string[]> {
	const objectUrls = await Promise.all(
		fileBuffers.map((fileBuffer) => uploadToBucket(bucketName, fileBuffer, contentType))
	);
	return objectUrls;
}
