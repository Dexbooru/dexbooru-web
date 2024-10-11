#!/bin/bash


cd ../docker/localstack-s3
echo "Composing dexbooru s3 container from localstack"

docker-compose --env-file "../../.env.local" up -d && \
aws --endpoint-url=http://localhost:4566 s3 mb s3://dexbooru-dev-pfps && \
aws --endpoint-url=http://localhost:4566 s3 mb s3://dexbooru-dev-posts

echo "Spun up localstack S3 container and created required application buckets"
aws --endpoint-url=http://localhost:4566 s3 ls