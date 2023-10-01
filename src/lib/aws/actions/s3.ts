import { PutObjectCommand } from '@aws-sdk/client-s3';
import awsS3 from '../s3';

export async function uploadToBucket(
	bucketName: string,
	file: Buffer,
	contentType: string
): Promise<string | null> {
	if (!bucketName) return null;

	const objectId = crypto.randomUUID();
	const uploadParams = {
		Bucket: bucketName,
		Key: objectId,
		Body: file,
		ContentType: contentType
	};

	try {
		await awsS3.send(new PutObjectCommand(uploadParams));
		const objectUrl = `https://${bucketName}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${objectId}`;
		return objectUrl;
	} catch (error) {
		return null;
	}
}
