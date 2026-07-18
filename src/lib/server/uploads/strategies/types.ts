import type { TS3ObjectSource } from '../../types/aws';
import type {
	TImageTransformPreset,
	TMediaUploadResult,
	TMediaUploadResourceType,
} from '../../types/upload';
import type { TImageData } from '../../types/images';

export type TMediaUploadStrategy = {
	resourceType: TMediaUploadResourceType;
	transformPreset: TImageTransformPreset;
	destinationBucket: string;
	objectSource: TS3ObjectSource;
	emitProgress: boolean;
	uploadFinals: (transformed: TImageData[]) => Promise<{
		imageUrls: string[];
		imageWidths: number[];
		imageHeights: number[];
		finalObjectKeys: string[];
	}>;
	toCompletionResult: (args: {
		imageUrls: string[];
		imageWidths: number[];
		imageHeights: number[];
		imageHashes: string[];
	}) => TMediaUploadResult;
};
