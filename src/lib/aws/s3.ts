import {S3Client} from '@aws-sdk/client-s3';


const awsS3 = new S3Client({ region: process.env.AWS_REGION});

export default awsS3;
    