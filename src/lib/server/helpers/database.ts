import redis from '$lib/server/db/redis';

export async function cacheQuery<ArgsType>(args: ArgsType, query: CallableFunction) {
	const stringifiedArgs = JSON.stringify(args);
	const queryCacheResult = await redis.get(stringifiedArgs);
	if (queryCacheResult) {
		return JSON.parse(queryCacheResult);
	}

	const queryResults = await query(args);
	await redis.set(stringifiedArgs, JSON.stringify(queryResults), { EX: 30 });

	return queryResults;
}
