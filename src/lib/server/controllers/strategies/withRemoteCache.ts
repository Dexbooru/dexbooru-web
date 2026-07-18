import {
	cacheMultipleToCollectionRemotely,
	cacheResponseRemotely,
	getRemoteResponseFromCache,
} from '../../helpers/sessions';
import type { TWithRemoteCacheOptions } from './types';

export async function withRemoteCache<T>(options: TWithRemoteCacheOptions<T>): Promise<T> {
	const { cacheKey, ttlSeconds, shouldCache = true, getAssociateKeys, compute } = options;

	const cachedData = await getRemoteResponseFromCache<T>(cacheKey);
	if (cachedData) {
		return cachedData;
	}

	const computed = await compute();

	if (shouldCache) {
		cacheResponseRemotely(cacheKey, computed, ttlSeconds);
		const associateKeys = getAssociateKeys?.(computed) ?? [];
		if (associateKeys.length > 0) {
			cacheMultipleToCollectionRemotely(associateKeys, cacheKey);
		}
	}

	return computed;
}
