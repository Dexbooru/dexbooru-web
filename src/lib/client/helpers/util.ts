// eslint-disable-next-line @typescript-eslint/ban-types
export function debounce(fn: Function, timeoutMs: number) {
	let currentTimeoutId: NodeJS.Timeout | undefined = undefined;

	return (...args: never[]) => {
		clearTimeout(currentTimeoutId);
		currentTimeoutId = setTimeout(() => {
			fn(...args);
		}, timeoutMs);
	};
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function memoize(fn: Function, isAsync: boolean = false) {
	const cachedResults: Map<string, never> = new Map<string, never>();

	if (isAsync) {
		return async (...args: never[]) => {
			const stringifiedArgs = JSON.stringify(args);
			if (cachedResults.has(stringifiedArgs)) {
				return cachedResults.get(stringifiedArgs);
			}

			const result = await fn(args);
			cachedResults.set(stringifiedArgs, result as never);
			return result;
		};
	}

	return (...args: never[]) => {
		const stringifiedArgs = JSON.stringify(args);
		if (cachedResults.has(stringifiedArgs)) {
			return cachedResults.get(stringifiedArgs);
		}

		const result = fn(args);
		cachedResults.set(stringifiedArgs, result as never);
		return result;
	};
}
