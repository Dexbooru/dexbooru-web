import { uploadStatusEmitter } from '$lib/server/events/uploadStatus';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const { uploadId } = params;

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			const send = (data: string) => {
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
			};

			const onStatusUpdate = (message: string) => {
				send(message);
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
