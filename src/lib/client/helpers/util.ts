type AnyFunction = (..._args: unknown[]) => unknown;

export function debounce<T extends AnyFunction>(
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

export function memoize<Args extends unknown[], R>(
	_fn: (..._args: Args) => R,
	_isAsync: true,
): (..._args: Args) => Promise<Awaited<R>>;

export function memoize<Args extends unknown[], R>(
	_fn: (..._args: Args) => R,
	_isAsync?: false,
): (..._args: Args) => R;

export function memoize<Args extends unknown[], R>(
	fn: (..._args: Args) => R,
	isAsync: boolean = false,
): (..._args: Args) => R | Promise<Awaited<R>> {
	const cachedResults = new Map<string, R | Awaited<R>>();

	if (isAsync) {
		return async (..._args: Args): Promise<Awaited<R>> => {
			const stringifiedArgs = JSON.stringify(_args);
			if (cachedResults.has(stringifiedArgs)) {
				return cachedResults.get(stringifiedArgs) as Awaited<R>;
			}

			const result = await fn(..._args);
			cachedResults.set(stringifiedArgs, result as Awaited<R>);
			return result as Awaited<R>;
		};
	}

	return (...args: Args): R => {
		const stringifiedArgs = JSON.stringify(args);
		if (cachedResults.has(stringifiedArgs)) {
			return cachedResults.get(stringifiedArgs) as R;
		}

		const result = fn(...args);
		cachedResults.set(stringifiedArgs, result);
		return result;
	};
}
