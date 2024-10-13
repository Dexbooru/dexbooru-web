import { dev } from '$app/environment';
import { S3Client } from '@aws-sdk/client-s3';
import { AWS_DEFAULT_REGION, AWS_S3_LOCAL_ENDPOINT } from '../constants/aws';

const awsS3 = new S3Client({
	region: AWS_DEFAULT_REGION,
	...(dev && {
		endpoint: AWS_S3_LOCAL_ENDPOINT,
		forcePathStyle: true,
	}),
});

export default awsS3;
