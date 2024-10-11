import { dev } from '$app/environment';
import { S3Client } from '@aws-sdk/client-s3';
import { AWS_DEFAULT_REGION } from '../constants/aws';

const awsS3 = new S3Client({
	region: AWS_DEFAULT_REGION,
	...(dev && {
		endpoint: 'http://localhost:4566',
		forcePathStyle: true,
	}),
});

export default awsS3;
