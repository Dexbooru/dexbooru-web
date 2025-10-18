import { dev } from '$app/environment';

export const AWS_DEFAULT_REGION = 'us-east-1';
export const AWS_PROFILE_PICTURE_BUCKET_NAME = dev ? 'dexbooru-dev-pfps' : 'dexbooru-prd-pfps';
export const AWS_POST_PICTURE_BUCKET_NAME = dev ? 'dexbooru-dev-posts' : 'dexbooru-prd-posts';
export const AWS_COLLECTION_PICTURE_BUCKET_NAME = dev
	? 'dexbooru-dev-collections'
	: 'dexbooru-prd-collections';
export const AWS_BUCKET_NAMES = [
	AWS_POST_PICTURE_BUCKET_NAME,
	AWS_PROFILE_PICTURE_BUCKET_NAME,
	AWS_COLLECTION_PICTURE_BUCKET_NAME,
];
export const AWS_S3_LOCAL_ENDPOINT = 'http://localhost:4566';
export const AWS_LOCAL_POSTS_BASE_URL = `${AWS_S3_LOCAL_ENDPOINT}/${AWS_POST_PICTURE_BUCKET_NAME}`;
export const AWS_LOCAL_PROFILE_PICTURE_BASE_URL = `${AWS_S3_LOCAL_ENDPOINT}/${AWS_PROFILE_PICTURE_BUCKET_NAME}`;
export const AWS_LOCAL_COLLECTION_PICTURE_BASE_URL = `${AWS_S3_LOCAL_ENDPOINT}/${AWS_COLLECTION_PICTURE_BUCKET_NAME}`;
