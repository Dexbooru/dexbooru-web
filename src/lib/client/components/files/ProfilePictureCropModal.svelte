<script lang="ts">
	import {
		PROFILE_PICTURE_CROP_EXPORT_SIZE,
		PROFILE_PICTURE_CROP_PNG_QUALITY,
		PROFILE_PICTURE_CROP_UI_SIZE,
		PROFILE_PICTURE_CROP_ZOOM_MAX,
		PROFILE_PICTURE_CROP_ZOOM_MIN,
		PROFILE_PICTURE_CROP_ZOOM_STEP,
		PROFILE_PICTURE_CROP_ZOOM_WHEEL_DELTA,
	} from '$lib/client/constants/images';
	import Button from 'flowbite-svelte/Button.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';

	type Props = {
		open: boolean;
		imageSrc: string;
		onConfirm: (croppedFile: File) => void;
		onCancel: () => void;
	};

	let { open = $bindable(), imageSrc, onConfirm, onCancel }: Props = $props();

	let imageElement: HTMLImageElement | null = $state(null);
	let imageLoaded = $state(false);
	let imageWidth = $state(0);
	let imageHeight = $state(0);

	let scale = $state(1);
	let position = $state({ x: 0, y: 0 });
	let isDragging = $state(false);
	let dragStart = $state({ x: 0, y: 0, posX: 0, posY: 0 });

	let baseScale = $derived.by(() => {
		if (!imageWidth || !imageHeight) return 1;
		return Math.min(
			PROFILE_PICTURE_CROP_UI_SIZE / imageWidth,
			PROFILE_PICTURE_CROP_UI_SIZE / imageHeight,
		);
	});

	let currentScale = $derived(baseScale * scale);

	let hasInitializedCrop = $state(false);
	let isApplying = $state(false);

	function centerImage() {
		if (!imageWidth || !imageHeight) return;
		const scaleValue = baseScale * scale;
		position = {
			x: (PROFILE_PICTURE_CROP_UI_SIZE - imageWidth * scaleValue) / 2,
			y: (PROFILE_PICTURE_CROP_UI_SIZE - imageHeight * scaleValue) / 2,
		};
	}

	$effect(() => {
		if (imageLoaded && imageWidth && imageHeight && !hasInitializedCrop) {
			hasInitializedCrop = true;
			scale = 1;
			centerImage();
		}
	});

	function handleImageLoad() {
		if (!imageElement) return;
		imageWidth = imageElement.naturalWidth;
		imageHeight = imageElement.naturalHeight;
		imageLoaded = true;
	}

	function handlePointerDown(e: PointerEvent) {
		isDragging = true;
		dragStart = {
			x: e.clientX,
			y: e.clientY,
			posX: position.x,
			posY: position.y,
		};
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		position = {
			x: dragStart.posX + (e.clientX - dragStart.x),
			y: dragStart.posY + (e.clientY - dragStart.y),
		};
	}

	function handlePointerUp(e: PointerEvent) {
		isDragging = false;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const delta =
			e.deltaY > 0 ? -PROFILE_PICTURE_CROP_ZOOM_WHEEL_DELTA : PROFILE_PICTURE_CROP_ZOOM_WHEEL_DELTA;
		const newScale = Math.max(
			PROFILE_PICTURE_CROP_ZOOM_MIN,
			Math.min(PROFILE_PICTURE_CROP_ZOOM_MAX, scale + delta),
		);
		const centerX = PROFILE_PICTURE_CROP_UI_SIZE / 2;
		const centerY = PROFILE_PICTURE_CROP_UI_SIZE / 2;
		const scaleFactor = newScale / scale;
		position = {
			x: centerX - (centerX - position.x) * scaleFactor,
			y: centerY - (centerY - position.y) * scaleFactor,
		};
		scale = newScale;
	}

	async function cropAndExport(): Promise<File | null> {
		if (!imageElement || !imageLoaded) return null;

		const canvas = document.createElement('canvas');
		canvas.width = PROFILE_PICTURE_CROP_EXPORT_SIZE;
		canvas.height = PROFILE_PICTURE_CROP_EXPORT_SIZE;
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;

		const srcX = -position.x / currentScale;
		const srcY = -position.y / currentScale;
		const srcSize = PROFILE_PICTURE_CROP_UI_SIZE / currentScale;

		ctx.drawImage(
			imageElement,
			srcX,
			srcY,
			srcSize,
			srcSize,
			0,
			0,
			PROFILE_PICTURE_CROP_EXPORT_SIZE,
			PROFILE_PICTURE_CROP_EXPORT_SIZE,
		);

		return new Promise<File | null>((resolve) => {
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						resolve(null);
						return;
					}
					resolve(
						new File([blob], 'profile-picture.png', {
							type: 'image/png',
							lastModified: Date.now(),
						}),
					);
				},
				'image/png',
				PROFILE_PICTURE_CROP_PNG_QUALITY,
			);
		});
	}

	async function handleConfirm() {
		isApplying = true;
		try {
			const file = await cropAndExport();
			if (file) {
				onConfirm(file);
			}
		} finally {
			isApplying = false;
		}
	}

	function handleCancel() {
		onCancel();
	}
</script>

<Modal
	bind:open
	title="Adjust your profile picture"
	size="xl"
	outsideclose
	oncancel={handleCancel}
	autoclose={false}
>
	<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
		Drag the image to reposition it. Scroll or use the slider to zoom. The circle shows how it will
		appear.
	</p>

	<div class="mb-4 flex w-full max-w-md items-center gap-3">
		<span class="text-sm text-gray-500 dark:text-gray-400">Zoom</span>
		<input
			type="range"
			min={PROFILE_PICTURE_CROP_ZOOM_MIN}
			max={PROFILE_PICTURE_CROP_ZOOM_MAX}
			step={PROFILE_PICTURE_CROP_ZOOM_STEP}
			value={scale}
			oninput={(e) => {
				const newScale = parseFloat((e.currentTarget as HTMLInputElement).value);
				const centerX = PROFILE_PICTURE_CROP_UI_SIZE / 2;
				const centerY = PROFILE_PICTURE_CROP_UI_SIZE / 2;
				const scaleFactor = newScale / scale;
				position = {
					x: centerX - (centerX - position.x) * scaleFactor,
					y: centerY - (centerY - position.y) * scaleFactor,
				};
				scale = newScale;
			}}
			class="h-2 w-full cursor-pointer rounded-lg bg-gray-200 dark:bg-gray-700"
		/>
		<span class="min-w-10 text-sm text-gray-500 dark:text-gray-400">{Math.round(scale * 100)}%</span
		>
	</div>

	<div class="flex flex-col items-center gap-6 sm:flex-row">
		<!-- Crop area -->
		<div
			class="relative shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
			style="width: {PROFILE_PICTURE_CROP_UI_SIZE}px; height: {PROFILE_PICTURE_CROP_UI_SIZE}px;"
			role="img"
			aria-label="Profile picture crop area"
		>
			<div
				class="absolute top-0 left-0 cursor-grab overflow-hidden rounded-full"
				style="width: {PROFILE_PICTURE_CROP_UI_SIZE}px; height: {PROFILE_PICTURE_CROP_UI_SIZE}px;"
				class:cursor-grabbing={isDragging}
				onpointerdown={handlePointerDown}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointerleave={handlePointerUp}
				onwheel={handleWheel}
				role="presentation"
				tabindex="-1"
			>
				{#if imageSrc}
					<img
						bind:this={imageElement}
						src={imageSrc}
						alt=""
						class="pointer-events-none select-none"
						style="
							width: {imageWidth * currentScale}px;
							height: {imageHeight * currentScale}px;
							transform: translate({position.x}px, {position.y}px);
						"
						draggable="false"
						onload={handleImageLoad}
					/>
				{/if}
			</div>
		</div>

		<!-- Live preview -->
		<div class="flex flex-col items-center gap-2">
			<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</span>
			<div
				class="overflow-hidden rounded-full border-2 border-gray-300 dark:border-gray-600"
				style="width: {PROFILE_PICTURE_CROP_EXPORT_SIZE}px; height: {PROFILE_PICTURE_CROP_EXPORT_SIZE}px;"
			>
				{#if imageSrc && imageLoaded}
					<div
						class="shrink-0"
						style="
							width: {PROFILE_PICTURE_CROP_UI_SIZE}px;
							height: {PROFILE_PICTURE_CROP_UI_SIZE}px;
							transform: scale({PROFILE_PICTURE_CROP_EXPORT_SIZE / PROFILE_PICTURE_CROP_UI_SIZE});
							transform-origin: 0 0;
							background: url('{imageSrc}') no-repeat;
							background-size: {imageWidth * currentScale}px {imageHeight * currentScale}px;
							background-position: {position.x}px {position.y}px;
						"
					></div>
				{/if}
			</div>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex items-center gap-2">
			<Button color="alternative" onclick={handleCancel} disabled={isApplying}>Cancel</Button>
			<Button onclick={handleConfirm} disabled={isApplying}>
				{#if isApplying}
					<Spinner size="4" class="me-2" />
				{/if}
				Apply
			</Button>
		</div>
	{/snippet}
</Modal>
