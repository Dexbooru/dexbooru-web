import type { ResizeOptions, Sharp, WebpOptions } from 'sharp';
import sharp from 'sharp';
import type { TImageData } from '../../types/images';

export type TImageVariantName = keyof TImageData['buffers'];

type TPendingCapture = {
	name: TImageVariantName;
	pipeline: Sharp;
};

const DEFAULT_RESIZE_BACKGROUND = { r: 0, g: 0, b: 0, alpha: 0 };

const getImageResizeOptions = (width: number, height: number): ResizeOptions => ({
	width,
	height,
	fit: 'contain',
	background: DEFAULT_RESIZE_BACKGROUND,
});

/**
 * Fluent Sharp pipeline builder. Buffer-first, no I/O.
 * Capture snapshots of the current pipeline as named variants, then {@link build}.
 */
export class ImageTransformationBuilder {
	private current: Sharp;
	private readonly pendingCaptures: TPendingCapture[] = [];

	private constructor(input: Buffer) {
		this.current = sharp(input);
	}

	static from(buffer: Buffer): ImageTransformationBuilder {
		return new ImageTransformationBuilder(buffer);
	}

	static async fromFile(file: File): Promise<ImageTransformationBuilder> {
		const arrayBuffer = await file.arrayBuffer();
		return ImageTransformationBuilder.from(Buffer.from(arrayBuffer));
	}

	webp(options: WebpOptions): this {
		this.current = this.current.webp(options);
		return this;
	}

	resize(width: number, height: number): this {
		this.current = this.current.resize(getImageResizeOptions(width, height));
		return this;
	}

	blur(sigma: number = 40): this {
		this.current = this.current.blur(sigma);
		return this;
	}

	capture(name: TImageVariantName): this {
		this.pendingCaptures.push({ name, pipeline: this.current.clone() });
		return this;
	}

	when(condition: boolean, apply: (builder: this) => this): this {
		if (condition) {
			return apply(this);
		}
		return this;
	}

	async toBuffer(): Promise<Buffer> {
		return this.current.toBuffer();
	}

	async build(): Promise<TImageData> {
		const imageData = {
			buffers: {},
			metadata: {},
		} as TImageData;

		for (const { name, pipeline } of this.pendingCaptures) {
			const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
			imageData.buffers[name] = data;
			imageData.metadata[name] = {
				width: info.width ?? 0,
				height: info.height ?? 0,
			};
		}

		return imageData;
	}
}
