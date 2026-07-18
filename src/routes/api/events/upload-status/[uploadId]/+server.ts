import { uploadStatusEmitter } from '$lib/server/events/uploadStatus';
import type { TUploadStatusEvent } from '$lib/server/types/upload';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const { uploadId } = params;

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			const send = (data: string, eventName?: string) => {
				const prefix = eventName ? `event: ${eventName}\n` : '';
				controller.enqueue(encoder.encode(`${prefix}data: ${data}\n\n`));
			};

			const onStatusUpdate = (event: TUploadStatusEvent | string) => {
				// Back-compat if a bare string is ever emitted
				if (typeof event === 'string') {
					send(event);
					return;
				}

				if (event.uploadId !== uploadId) return;

				if (event.kind === 'failed') {
					send(event.message, 'failed');
					return;
				}

				send(event.message);
			};

			uploadStatusEmitter.on(uploadId, onStatusUpdate);

			send('Connected to upload status stream');

			return () => {
				uploadStatusEmitter.off(uploadId, onStatusUpdate);
			};
		},
		cancel() {
			uploadStatusEmitter.removeAllListeners(uploadId);
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	});
};
