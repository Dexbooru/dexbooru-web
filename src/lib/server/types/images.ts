export type TImageData = {
	buffers: {
		original: Buffer;
		nsfwPreview?: Buffer;
		preview?: Buffer;
	};
	metadata: {
		original: TImageMetadata;
		nsfwPreview?: TImageMetadata;
		preview?: TImageMetadata;
	};
};

export type TImageMetadata = {
	width: number;
	height: number;
};
