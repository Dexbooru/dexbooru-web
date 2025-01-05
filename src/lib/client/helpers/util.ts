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
export function memoize<T extends (..._args: unknown[]) => unknown>(
	fn: T,
	isAsync: boolean = false,
): T {
	const cachedResults: Map<string, ReturnType<T>> = new Map();

	if (isAsync) {
		return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
			const stringifiedArgs = JSON.stringify(args);
			if (cachedResults.has(stringifiedArgs)) {
				return cachedResults.get(stringifiedArgs)!;
			}

			const result = await (fn(...args) as Promise<ReturnType<T>>);
			cachedResults.set(stringifiedArgs, result);
			return result;
		}) as T;
	}

	return ((...args: Parameters<T>): ReturnType<T> => {
		const stringifiedArgs = JSON.stringify(args);
		if (cachedResults.has(stringifiedArgs)) {
			return cachedResults.get(stringifiedArgs)!;
		}

		const result = fn(...args);
		cachedResults.set(stringifiedArgs, result as ReturnType<T>);
		return result as ReturnType<T>;
	}) as T;
}
