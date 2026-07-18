import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { ImageTransformationBuilder } from '$lib/server/helpers/images/imageTransformationBuilder';
import { transformPostImage } from '$lib/server/helpers/images/presets';

async function createTestPngBuffer(width = 64, height = 48): Promise<Buffer> {
	return sharp({
		create: {
			width,
			height,
			channels: 3,
			background: { r: 20, g: 40, b: 60 },
		},
	})
		.png()
		.toBuffer();
}

describe('ImageTransformationBuilder', () => {
	it('captures original, preview, and optional nsfw variants', async () => {
		const input = await createTestPngBuffer();

		const imageData = await ImageTransformationBuilder.from(input)
			.webp({ quality: 80 })
			.capture('original')
			.resize(32, 32)
			.capture('preview')
			.when(true, (builder) => builder.blur(10).capture('nsfwPreview'))
			.build();

		expect(imageData.buffers.original).toBeInstanceOf(Buffer);
		expect(imageData.buffers.preview).toBeInstanceOf(Buffer);
		expect(imageData.buffers.nsfwPreview).toBeInstanceOf(Buffer);
		expect(imageData.metadata.original.width).toBeGreaterThan(0);
		expect(imageData.metadata.preview?.width).toBeLessThanOrEqual(32);
		expect(imageData.metadata.preview?.height).toBeLessThanOrEqual(32);
	});

	it('skips nsfw capture when condition is false', async () => {
		const input = await createTestPngBuffer();
		const imageData = await transformPostImage(input, false);

		expect(imageData.buffers.original).toBeInstanceOf(Buffer);
		expect(imageData.buffers.preview).toBeInstanceOf(Buffer);
		expect(imageData.buffers.nsfwPreview).toBeUndefined();
	});

	it('supports single-buffer toBuffer terminal', async () => {
		const input = await createTestPngBuffer();
		const output = await ImageTransformationBuilder.from(input)
			.webp({ quality: 80 })
			.resize(16, 16)
			.toBuffer();

		expect(output).toBeInstanceOf(Buffer);
		expect(output.byteLength).toBeGreaterThan(0);
	});
});
