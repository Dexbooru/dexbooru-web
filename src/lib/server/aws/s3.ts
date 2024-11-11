import { dev } from '$app/environment';
import { AWS_CLOUDFRONT_ENDPOINT } from '$env/static/private';
import { S3Client } from '@aws-sdk/client-s3';
import { AWS_DEFAULT_REGION, AWS_S3_LOCAL_ENDPOINT } from '../constants/aws';

const endpointConfig: Record<string, unknown> = {};
if (dev) {
	endpointConfig.endpoint = AWS_S3_LOCAL_ENDPOINT;
	endpointConfig.forcePathStyle = true;
} else {
	if (typeof AWS_CLOUDFRONT_ENDPOINT === 'string' && AWS_CLOUDFRONT_ENDPOINT.length > 0) {
		endpointConfig.endpoint = AWS_CLOUDFRONT_ENDPOINT;
		endpointConfig.forcePathStyle = true;
	}
}

const awsS3 = new S3Client({
	region: AWS_DEFAULT_REGION,
	...endpointConfig,
});

export default awsS3;
