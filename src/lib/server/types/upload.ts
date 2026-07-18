export type TMediaUploadResourceType = 'posts' | 'collections' | 'user-profiles';

export type TImageTransformPreset = 'post' | 'collection' | 'profile';

export type TUploadProgressEvent = {
	uploadId: string;
	kind: 'progress';
	message: string;
};

export type TMediaUploadResult = {
	imageUrls: string[];
	imageWidths: number[];
	imageHeights: number[];
	imageHashes: string[];
};

/** @deprecated Prefer {@link TMediaUploadResult}; kept for createPost field mapping. */
export type TUploadCompletedResult = {
	postImageUrls: string[];
	postImageWidths: number[];
	postImageHeights: number[];
	postImageHashes: string[];
};

export type TUploadCompletedEvent = {
	uploadId: string;
	kind: 'completed';
	message: string;
	result: TMediaUploadResult;
};

export type TUploadFailedEvent = {
	uploadId: string;
	kind: 'failed';
	message: string;
	errorCode?: string;
};

export type TUploadStatusEvent = TUploadProgressEvent | TUploadCompletedEvent | TUploadFailedEvent;

export type TMediaUploadItem = {
	index: number;
	tempObjectKey: string;
	contentType: string;
	sha256: string;
};

export type TMediaUploadJob = {
	uploadId: string;
	resourceType: TMediaUploadResourceType;
	isNsfw: boolean;
	images: TMediaUploadItem[];
};

export const toPostUploadCompletedResult = (
	result: TMediaUploadResult,
): TUploadCompletedResult => ({
	postImageUrls: result.imageUrls,
	postImageWidths: result.imageWidths,
	postImageHeights: result.imageHeights,
	postImageHashes: result.imageHashes,
});
