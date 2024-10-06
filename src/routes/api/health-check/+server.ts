import prisma from '$lib/server/db/prisma';
import redis from '$lib/server/db/redis';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '$lib/server/helpers/controllers';
import type { TRequestSchema } from '$lib/server/types/controllers';
import { Prisma } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';

const GetHealthCheckSchema = {} satisfies TRequestSchema;

export const GET: RequestHandler = async (request) => {
	return (await validateAndHandleRequest(
		request,
		'api-route',
		GetHealthCheckSchema,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		async (data) => {
			try {
				await prisma.$executeRaw(Prisma.sql`SELECT 1`);
				await redis.ping('health-check-ping');

				return createSuccessResponse('api-route', 'Service is healthy');
			} catch (error) {
				return createErrorResponse('api-route', 500, (error as Error).message);
			}
		},
	)) as ReturnType<RequestHandler>;
};
