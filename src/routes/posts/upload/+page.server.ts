import { error, fail } from '@sveltejs/kit';
import type { Actions, Action, PageServerLoad } from './$types';
import { getFormFields } from '$lib/shared/helpers/forms';
import type { IUploadFormFields } from '$lib/shared/types/upload';
import {
	isArtistValid,
	isTagValid,
	isValidDescription,
	transformLabels
} from '$lib/shared/helpers/labels';
import { createPost } from '$lib/server/db/actions/post';
import { MAXIMUM_IMAGES_PER_POST } from '$lib/shared/constants/images';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import { runPostImageTransformationPipelineInBatch } from '$lib/server/helpers/images';
import { uploadBatchToBucket } from '$lib/server/aws/actions/s3';

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
		postImageFiles
	} = getFormFields<IUploadFormFields>(uploadForm, ['postImageFiles']);

	const postImagesArray = Array.from(postImageFiles);
	const tags = transformLabels(tagsStr);
	const artists = transformLabels(artistsStr);

	if (!description || !tags.length || !artists.length || !postImagesArray.length) {
		return fail(400, {
			description,
			tags,
			artists: tagsStr,
			reason: 'At least one the required fields was missing!'
		});
	}

	if (!isValidDescription(description)) {
		return fail(400, {
			description,
			tags,
			artists,
			reason: 'The description did not meet the requirements!'
		});
	}

	if (tags.some((tag) => !isTagValid(tag))) {
		return fail(400, {
			description,
			tags,
			artists,
			reason: 'At least one of the tags did not meet the labelling requirements!'
		});
	}

	if (artists.some((artist) => !isArtistValid(artist))) {
		return fail(400, {
			description,
			tags,
			artists,
			reason: 'At least one of the artists did not meet the labelling requirements!'
		});
	}

	if (postImagesArray.length > MAXIMUM_IMAGES_PER_POST) {
		return fail(400, {
			description,
			tags,
			artists,
			reason: 'The number of images sent exceeded the maximum amount allowed per post!'
		});
	}

	if (postImagesArray.some((postImageFile) => !isFileImage(postImageFile))) {
		return fail(400, {
			description,
			tags,
			artists,
			reason: 'At least one of the files provided is not an image!'
		});
	}

	if (postImagesArray.some((postImageFile) => !isFileImageSmall(postImageFile))) {
		return fail(400, {
			description,
			tags,
			artists,
			reason: 'At least one of the images exceeded the maximum file size allowed for an image!'
		});
	}

	const postImageFileBuffers = await runPostImageTransformationPipelineInBatch(postImagesArray);
	const postImageUrls = await uploadBatchToBucket(
		process.env.AWS_POST_PICTURE_BUCKET || '',
		postImageFileBuffers
	);

	await createPost(description, tags, artists, postImageUrls, locals.user.id);
};

export const actions = {
	default: handleUpload
} satisfies Actions;

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		throw error(401);
	}
};
