import {
	cacheMultipleToCollectionRemotely,
	cacheResponseRemotely,
	getRemoteResponseFromCache,
} from '../../helpers/sessions';
import type { TWithRemoteCacheOptions } from './types';

export async function withRemoteCache<T>(options: TWithRemoteCacheOptions<T>): Promise<T> {
	const {
		cacheKey,
		ttlSeconds,
		shouldCache = true,
		resolveTtl,
		getAssociateKeys,
		compute,
	} = options;

	const cachedData = await getRemoteResponseFromCache<T>(cacheKey);
	if (cachedData !== null) {
		return cachedData;
	}

	const computed = await compute();
	const canCache = typeof shouldCache === 'function' ? shouldCache(computed) : shouldCache;

	if (canCache) {
		const ttl = resolveTtl?.(computed) ?? ttlSeconds;
		const associateKeys = getAssociateKeys?.(computed) ?? [];
		await Promise.all([
			cacheResponseRemotely(cacheKey, computed, ttl),
			associateKeys.length > 0
				? cacheMultipleToCollectionRemotely(associateKeys, cacheKey)
				: Promise.resolve(),
		]);
	}

	return computed;
}
