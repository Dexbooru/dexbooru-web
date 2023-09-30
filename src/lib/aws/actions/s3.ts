import awsS3 from '../s3';

export async function uploadToBucket(
	bucketName: string,
	id: string,
	file: Buffer,
	contentType: string
) {
	const uploadParams = {
		Bucket: bucketName,
		Key: `${id}.${contentType === 'image/jpeg' ? 'jpeg' : 'png'}`,
		Body: file,
		ContentType: contentType
	};
	try {
		await awsS3.upload(uploadParams).promise();
	} catch (error) {
		console.error(error);
	}
}
