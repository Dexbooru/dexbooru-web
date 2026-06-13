import { getApplicationConfiguration } from '$lib/server/applicationConfiguration';
import { applicationConfigurationEmitter } from '$lib/server/events/applicationConfiguration';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	let onUpdate: ((payload: unknown) => void) | null = null;

	const stream = new ReadableStream({
		async start(controller) {
			const send = (data: unknown) => {
				controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
			};

			const currentConfiguration = await getApplicationConfiguration();
			send(currentConfiguration);

			onUpdate = (payload: unknown) => {
				send(payload);
			};

			applicationConfigurationEmitter.on('updated', onUpdate);
			return () => {
				if (onUpdate) {
					applicationConfigurationEmitter.off('updated', onUpdate);
				}
			};
		},
		cancel() {
			if (onUpdate) {
				applicationConfigurationEmitter.off('updated', onUpdate);
			}
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
