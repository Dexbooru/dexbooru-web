import type { TImageData } from '../types/images';
import type { TImageTransformPreset } from '../types/upload';

export type TImageTransformWorkerRequest = {
	id: string;
	buffer: Uint8Array;
	isNsfw: boolean;
	preset: TImageTransformPreset;
};

export type TImageTransformWorkerResponse =
	| {
			id: string;
			ok: true;
			result: {
				buffers: {
					original: Uint8Array;
					preview?: Uint8Array;
					nsfwPreview?: Uint8Array;
				};
				metadata: TImageData['metadata'];
			};
	  }
	| {
			id: string;
			ok: false;
			error: string;
	  };
