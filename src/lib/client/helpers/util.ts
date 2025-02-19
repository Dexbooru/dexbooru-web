export function debounce<T extends (..._args: unknown[]) => void>(
	fn: T,
	timeoutMs: number,
): (..._args: Parameters<T>) => void {
	let currentTimeoutId: NodeJS.Timeout | undefined = undefined;

	return (..._args: Parameters<T>) => {
		clearTimeout(currentTimeoutId);
		currentTimeoutId = setTimeout(() => {
			fn(..._args);
		}, timeoutMs);
	};
}

export function memoize<T extends (..._args: unknown[]) => unknown>(
	fn: T,
	isAsync: boolean = false,
): T {
	const cachedResults = new Map<string, ReturnType<T>>();

	if (isAsync) {
		return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
			const stringifiedArgs = JSON.stringify(args);
			if (cachedResults.has(stringifiedArgs)) {
				return cachedResults.get(stringifiedArgs) as Awaited<ReturnType<T>>;
			}

			const result = await fn(...args);
			cachedResults.set(stringifiedArgs, result as ReturnType<T>);
			return result as Awaited<ReturnType<T>>;
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
