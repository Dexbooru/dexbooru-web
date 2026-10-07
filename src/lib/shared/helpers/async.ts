export const sleep = (milliseconds: number) =>
	new Promise<void>((resolve) => {
		setTimeout(resolve, milliseconds);
	});

type TFullJitterBackoffOptions = {
	retryIndex: number;
	baseMs: number;
	capMs: number;
	random?: () => number;
};

export const fullJitterBackoffMs = ({
	retryIndex,
	baseMs,
	capMs,
	random = Math.random,
}: TFullJitterBackoffOptions) => {
	const ceiling = Math.min(capMs, baseMs * 2 ** retryIndex);
	return Math.floor(random() * ceiling);
};

export const isAbortError = (error: unknown) =>
	(error instanceof DOMException || error instanceof Error) && error.name === 'AbortError';

export const isAbortOrTimeoutError = (error: unknown) =>
	isAbortError(error) ||
	((error instanceof DOMException || error instanceof Error) && error.name === 'TimeoutError');
