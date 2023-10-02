import { PutObjectCommand } from '@aws-sdk/client-s3';
import awsS3 from '../s3';

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
	const objectUrl = `https://${bucketName}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${objectId}`;
	return objectUrl;
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
