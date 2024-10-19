#!/bin/bash

cd ../docker/localstack-s3
echo "Composing dexbooru s3 container from localstack"

docker-compose --env-file "../../.env" up -d && \
aws --endpoint-url=http://localhost:4566 s3 mb s3://dexbooru-dev-pfps && \
aws --endpoint-url=http://localhost:4566 s3 mb s3://dexbooru-dev-posts && \
aws --endpoint-url=http://localhost:4566 s3 mb s3://dexbooru-dev-collections

echo "Spun up localstack S3 container and created required application buckets"
aws --endpoint-url=http://localhost:4566 s3 ls