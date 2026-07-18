import {
	COLLECTION_THUMBNAIL_HEIGHT,
	COLLECTION_THUMBNAIL_WIDTH,
	POST_PICTURE_PREVIEW_HEIGHT,
	POST_PICTURE_PREVIEW_WIDTH,
	PROFILE_PICTURE_HEIGHT,
	PROFILE_PICTURE_WIDTH,
} from '../../../shared/constants/images';
import { toPng as toDefaultProfilePng } from 'jdenticon';
import { WEBP_OPTIONS } from '../../constants/images';
import type { TImageData } from '../../types/images';
import { ImageTransformationBuilder } from './imageTransformationBuilder';

export const transformPostImage = (buffer: Buffer, isNsfw: boolean): Promise<TImageData> =>
	ImageTransformationBuilder.from(buffer)
		.webp(WEBP_OPTIONS)
		.capture('original')
		.resize(POST_PICTURE_PREVIEW_WIDTH, POST_PICTURE_PREVIEW_HEIGHT)
		.capture('preview')
		.when(isNsfw, (builder) => builder.blur(40).capture('nsfwPreview'))
		.build();

export const transformCollectionThumbnail = (
	buffer: Buffer,
	isNsfw: boolean,
): Promise<TImageData> =>
	ImageTransformationBuilder.from(buffer)
		.webp(WEBP_OPTIONS)
		.capture('original')
		.resize(COLLECTION_THUMBNAIL_WIDTH, COLLECTION_THUMBNAIL_HEIGHT)
		.capture('preview')
		.when(isNsfw, (builder) => builder.blur(40).capture('nsfwPreview'))
		.build();

export const transformProfilePicture = (buffer: Buffer): Promise<Buffer> =>
	ImageTransformationBuilder.from(buffer)
		.webp(WEBP_OPTIONS)
		.resize(PROFILE_PICTURE_WIDTH, PROFILE_PICTURE_HEIGHT)
		.toBuffer();

export async function transformDefaultProfilePicture(username: string): Promise<Buffer> {
	const imageBuffer = toDefaultProfilePng(username, 200);
	return transformProfilePicture(Buffer.from(imageBuffer));
}

export async function transformPostImageFromFile(file: File, isNsfw: boolean): Promise<TImageData> {
	const arrayBuffer = await file.arrayBuffer();
	return transformPostImage(Buffer.from(arrayBuffer), isNsfw);
}

export async function transformCollectionThumbnailFromFile(
	file: File,
	isNsfw: boolean,
): Promise<TImageData> {
	const arrayBuffer = await file.arrayBuffer();
	return transformCollectionThumbnail(Buffer.from(arrayBuffer), isNsfw);
}

export async function transformProfilePictureFromFile(file: File): Promise<Buffer> {
	const arrayBuffer = await file.arrayBuffer();
	return transformProfilePicture(Buffer.from(arrayBuffer));
}
