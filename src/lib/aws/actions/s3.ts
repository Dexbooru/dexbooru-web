import { PutObjectCommand } from '@aws-sdk/client-s3';
import awsS3 from '../s3';

export async function uploadToBucket(
	bucketName: string,
	id: string,
	file: Buffer,
	contentType: string
): Promise<boolean> {
	if (!bucketName) return false;

	const uploadParams = {
		Bucket: bucketName,
		Key: id,
		Body: file,
		ContentType: contentType
	};

	try {
		await awsS3.send(new PutObjectCommand(uploadParams));
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}
