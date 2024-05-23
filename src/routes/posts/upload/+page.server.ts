import { uploadBatchToBucket } from '$lib/server/aws/actions/s3';
import { AWS_POST_PICTURE_BUCKET_NAME } from '$lib/server/constants/aws';
import { createPost } from '$lib/server/db/actions/post';
import { runPostImageTransformationPipelineInBatch } from '$lib/server/helpers/images';
import { MAXIMUM_IMAGES_PER_POST } from '$lib/shared/constants/images';
import { getFormFields } from '$lib/shared/helpers/forms';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import {
	isArtistValid,
	isTagValid,
	isValidDescription,
	transformLabels
} from '$lib/shared/helpers/labels';
import type { IUploadFormFields } from '$lib/shared/types/upload';
import { error, fail } from '@sveltejs/kit';
import type { Action, Actions } from './$types';

const handleUpload: Action = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to upload posts, without being a signed in user!'
		});
	}

	const uploadForm = await request.formData();
	const {
		description,
		tags: tagsStr,
		artists: artistsStr,
		isNsfw,
		postPictures
	} = getFormFields<IUploadFormFields>(uploadForm, ['postPictures']);

	const finalIsNsfw = isNsfw === 'true' ? true : false;
	const postImagesArray = Array.from(postPictures);
	const tags = transformLabels(tagsStr);
	const artists = transformLabels(artistsStr);

	if (!description.length || !tags.length || !artists.length || !postImagesArray.length) {
		return fail(400, {
			description,
			tags,
			artists,
			isNsfw: finalIsNsfw,
			reason: 'At least one the required fields was missing!'
		});
	}

	if (!isValidDescription(description)) {
		return fail(400, {
			description,
			tags,
			artists,
			isNsfw: finalIsNsfw,
			reason: 'The description did not meet the requirements!'
		});
	}

	if (tags.some((tag) => !isTagValid(tag))) {
		return fail(400, {
			description,
			tags,
			artists,
			isNsfw: finalIsNsfw,
			reason: 'At least one of the tags did not meet the labelling requirements!'
		});
	}

	if (artists.some((artist) => !isArtistValid(artist))) {
		return fail(400, {
			description,
			tags,
			artists,
			isNsfw: finalIsNsfw,
			reason: 'At least one of the artists did not meet the labelling requirements!'
		});
	}

	if (postImagesArray.length > MAXIMUM_IMAGES_PER_POST) {
		return fail(400, {
			description,
			tags,
			artists,
			isNsfw: finalIsNsfw,
			reason: 'The number of images sent exceeded the maximum amount allowed per post!'
		});
	}

	if (postImagesArray.some((postImageFile) => !isFileImage(postImageFile))) {
		return fail(400, {
			description,
			tags,
			artists,
			isNsfw: finalIsNsfw,
			reason: 'At least one of the files provided is not an image!'
		});
	}

	if (postImagesArray.some((postImageFile) => !isFileImageSmall(postImageFile))) {
		return fail(400, {
			description,
			tags,
			artists,
			isNsfw: finalIsNsfw,
			reason: 'At least one of the images exceeded the maximum file size allowed for an image!'
		});
	}

	const postImageFileBuffers = await runPostImageTransformationPipelineInBatch(postImagesArray);
	const postImageUrls = await uploadBatchToBucket(
		AWS_POST_PICTURE_BUCKET_NAME,
		'posts',
		postImageFileBuffers
	);

	const newPost = await createPost(
		description,
		finalIsNsfw,
		tags,
		artists,
		postImageUrls,
		locals.user.id
	);
	return { newPost };
};

export const actions = {
	default: handleUpload
} satisfies Actions;
