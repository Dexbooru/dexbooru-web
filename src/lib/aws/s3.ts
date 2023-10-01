import { S3Client } from '@aws-sdk/client-s3';

const awsS3 = new S3Client({
	region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
});

export default awsS3;
