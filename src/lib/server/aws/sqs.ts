import { SQSClient } from "@aws-sdk/client-sqs";
import { AWS_DEFAULT_REGION } from "../constants/aws";

const awsSqs = new SQSClient({
    region: AWS_DEFAULT_REGION,
});

export default awsSqs;