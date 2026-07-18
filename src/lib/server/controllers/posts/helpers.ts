import { createErrorResponse } from '../../helpers/controllers';
import type { TControllerHandlerVariant } from '../../types/controllers';
import type { TUploadCompletedResult } from '../../types/upload';
import { toPostUploadCompletedResult } from '../../types/upload';
import { processMediaUpload } from '../../uploads/processMediaUpload';

export const throwPostNotFoundError = (handlerType: TControllerHandlerVariant, postId: string) => {
	const errorResponse = createErrorResponse(
		handlerType,
		404,
		`A post with the following id: ${postId} does not exist`,
	);
	if (handlerType === 'page-server-load') throw errorResponse;
	return errorResponse;
};

export const createPostFormErrorData = (errorData: Record<string, unknown>, message: string) => {
	return {
		...errorData,
		reason: message,
	};
};

export const uploadPostImages = async (
	postPictures: File[],
	isNsfw: boolean,
	uploadId?: string,
): Promise<TUploadCompletedResult> => {
	const result = await processMediaUpload({
		resourceType: 'posts',
		files: postPictures,
		isNsfw,
		uploadId,
		emitProgress: true,
	});
	return toPostUploadCompletedResult(result);
};
