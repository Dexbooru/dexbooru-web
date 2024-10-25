import { dev } from '$app/environment';

export const AWS_DEFAULT_REGION = 'us-west-2';
export const AWS_PROFILE_PICTURE_BUCKET_NAME = dev ? 'dexbooru-dev-pfps' : 'dexbooru-prd-pfps';
export const AWS_POST_PICTURE_BUCKET_NAME = dev ? 'dexbooru-dev-posts' : 'dexbooru-prd-posts';
export const AWS_COLLECTION_PICTURE_BUCKET_NAME = dev
	? 'dexbooru-dev-collections'
	: 'dexbooru-prd-collections';
export const AWS_BUCKET_NAMES = [AWS_POST_PICTURE_BUCKET_NAME, AWS_PROFILE_PICTURE_BUCKET_NAME];
export const AWS_LOCAL_POSTS_BASE_URL = `http://localhost:4566/${AWS_POST_PICTURE_BUCKET_NAME}`;
export const AWS_LOCAL_PROFILE_PICTURE_BASE_URL = `http://localhost:4566/${AWS_PROFILE_PICTURE_BUCKET_NAME}`;
export const AWS_LOCAL_COLLECTION_PICTURE_BASE_URL = `http://localhost:4566/${AWS_COLLECTION_PICTURE_BUCKET_NAME}`;
export const AWS_S3_LOCAL_ENDPOINT = 'http://localhost:4566';
