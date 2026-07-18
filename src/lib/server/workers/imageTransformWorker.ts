/**
 * Self-contained worker entry.
 * Must not import local project modules — worker_threads run outside Vite resolution,
 * so only bare npm imports (sharp) are safe here.
 */
import { parentPort } from 'node:worker_threads';
import sharp, { type ResizeOptions } from 'sharp';

type TImageTransformPreset = 'post' | 'collection' | 'profile';

type TImageTransformWorkerRequest = {
	id: string;
	buffer: Uint8Array;
	isNsfw: boolean;
	preset: TImageTransformPreset;
};

type TTransformedResult = {
	buffers: {
		original: Uint8Array;
		preview?: Uint8Array;
		nsfwPreview?: Uint8Array;
	};
	metadata: {
		original: { width: number; height: number };
		preview?: { width: number; height: number };
		nsfwPreview?: { width: number; height: number };
	};
};

type TImageTransformWorkerResponse =
	| { id: string; ok: true; result: TTransformedResult }
	| { id: string; ok: false; error: string };

const WEBP_OPTIONS = {
	quality: 95,
	lossless: true,
} as const;

const PRESET_DIMENSIONS: Record<
	Exclude<TImageTransformPreset, 'profile'>,
	{ width: number; height: number }
> = {
	post: { width: 350, height: 350 },
	collection: { width: 700, height: 700 },
};

const PROFILE_DIMENSIONS = { width: 128, height: 128 };

const toUint8Array = (buffer: Buffer): Uint8Array =>
	new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

const getResizeOptions = (width: number, height: number): ResizeOptions => ({
	width,
	height,
	fit: 'contain',
	background: { r: 0, g: 0, b: 0, alpha: 0 },
});

async function transformVariantImage(
	input: Buffer,
	isNsfw: boolean,
	width: number,
	height: number,
): Promise<TTransformedResult> {
	const base = sharp(input).webp(WEBP_OPTIONS);
	const original = await base.clone().toBuffer({ resolveWithObject: true });
	const previewPipeline = base.clone().resize(getResizeOptions(width, height));
	const preview = await previewPipeline.toBuffer({ resolveWithObject: true });

	const result: TTransformedResult = {
		buffers: {
			original: toUint8Array(original.data),
			preview: toUint8Array(preview.data),
		},
		metadata: {
			original: {
				width: original.info.width ?? 0,
				height: original.info.height ?? 0,
			},
			preview: {
				width: preview.info.width ?? 0,
				height: preview.info.height ?? 0,
			},
		},
	};

	if (isNsfw) {
		const nsfwPreview = await previewPipeline
			.clone()
			.blur(40)
			.toBuffer({ resolveWithObject: true });
		result.buffers.nsfwPreview = toUint8Array(nsfwPreview.data);
		result.metadata.nsfwPreview = {
			width: nsfwPreview.info.width ?? 0,
			height: nsfwPreview.info.height ?? 0,
		};
	}

	return result;
}

async function transformProfileImage(input: Buffer): Promise<TTransformedResult> {
	const { data, info } = await sharp(input)
		.webp(WEBP_OPTIONS)
		.resize(getResizeOptions(PROFILE_DIMENSIONS.width, PROFILE_DIMENSIONS.height))
		.toBuffer({ resolveWithObject: true });

	return {
		buffers: {
			original: toUint8Array(data),
		},
		metadata: {
			original: {
				width: info.width ?? 0,
				height: info.height ?? 0,
			},
		},
	};
}

async function transformByPreset(
	input: Buffer,
	isNsfw: boolean,
	preset: TImageTransformPreset,
): Promise<TTransformedResult> {
	if (preset === 'profile') {
		return transformProfileImage(input);
	}
	const dimensions = PRESET_DIMENSIONS[preset];
	return transformVariantImage(input, isNsfw, dimensions.width, dimensions.height);
}

if (!parentPort) {
	throw new Error('imageTransformWorker must be run as a worker thread');
}

parentPort.on('message', async (message: TImageTransformWorkerRequest) => {
	try {
		const result = await transformByPreset(
			Buffer.from(message.buffer),
			message.isNsfw,
			message.preset,
		);
		const response: TImageTransformWorkerResponse = {
			id: message.id,
			ok: true,
			result,
		};
		parentPort?.postMessage(response);
	} catch (error) {
		const response: TImageTransformWorkerResponse = {
			id: message.id,
			ok: false,
			error: error instanceof Error ? error.message : 'Unknown transform error',
		};
		parentPort?.postMessage(response);
	}
});
