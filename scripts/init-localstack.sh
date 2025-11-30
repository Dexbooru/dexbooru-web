#!/bin/bash
set -euo pipefail

# Define resource names for AWS localstack services
BUCKETS=(
  dexbooru-dev-pfps
  dexbooru-dev-posts
  dexbooru-dev-collections
  dexbooru-prd-pfps
  dexbooru-prd-posts
  dexbooru-prd-collections
)

QUEUES=(
  dexbooru-dev-post-anime-series-classification-queue
  dexbooru-prd-post-anime-series-classification-queue
)

# Creating S3 buckets
for b in "${BUCKETS[@]}"; do
  if awslocal s3 ls "s3://${b}" >/dev/null 2>&1; then
    echo "Bucket exists: s3://${b}"
  else
    echo "Creating bucket: s3://${b}"
    awslocal s3 mb "s3://${b}"
  fi
done

echo "Listing all buckets"
awslocal s3 ls

# Creating SQS queues
for q in "${QUEUES[@]}"; do
  if awslocal sqs create-queue --queue-name "${q}" >/dev/null 2>&1; then
    echo "Creating queue: ${q}"
  else
    echo "Failed to create queue: ${q}"
  fi
done

echo "Listing all queues"
awslocal sqs list-queues