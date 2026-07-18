import type { TMediaUploadResourceType } from '../../types/upload';
import { collectionMediaUploadStrategy } from './collectionMediaUpload';
import { postMediaUploadStrategy } from './postMediaUpload';
import { profileMediaUploadStrategy } from './profileMediaUpload';
import type { TMediaUploadStrategy } from './types';

export type { TMediaUploadStrategy } from './types';

export const mediaUploadStrategies: Record<TMediaUploadResourceType, TMediaUploadStrategy> = {
	posts: postMediaUploadStrategy,
	collections: collectionMediaUploadStrategy,
	'user-profiles': profileMediaUploadStrategy,
};

export const getMediaUploadStrategy = (resourceType: string): TMediaUploadStrategy | null => {
	if (resourceType in mediaUploadStrategies) {
		return mediaUploadStrategies[resourceType as TMediaUploadResourceType];
	}
	return null;
};
