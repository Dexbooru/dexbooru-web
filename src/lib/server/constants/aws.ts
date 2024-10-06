import { dev } from '$app/environment';

export const AWS_DEFAULT_REGION = 'us-west-2';
export const AWS_PROFILE_PICTURE_BUCKET_NAME = dev ? 'dexbooru-dev-pfps' : 'dexbooru-prd-pfps';
export const AWS_POST_PICTURE_BUCKET_NAME = dev ? 'dexbooru-dev-posts' : 'dexbooru-prd-posts';
