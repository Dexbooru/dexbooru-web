import { AWS_DEFAULT_REGION } from '../constants/aws';
import { S3Client } from '@aws-sdk/client-s3';

const awsS3 = new S3Client({
	region: AWS_DEFAULT_REGION
});

export default awsS3;
