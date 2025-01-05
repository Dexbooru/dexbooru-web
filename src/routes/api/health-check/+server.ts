import awsS3 from '$lib/server/aws/s3';
import { AWS_BUCKET_NAMES } from '$lib/server/constants/aws';
import prisma from '$lib/server/db/prisma';
import redis from '$lib/server/db/redis';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '$lib/server/helpers/controllers';
import type { TRequestSchema } from '$lib/server/types/controllers';
import { ListBucketsCommand } from '@aws-sdk/client-s3';
import type { RequestHandler } from '@sveltejs/kit';

const GetHealthCheckSchema = {} satisfies TRequestSchema;

export const GET: RequestHandler = async (request) => {
	return (await validateAndHandleRequest(request, 'api-route', GetHealthCheckSchema, async () => {
		try {
			const servicesStatus = {
				primaryPostgresDatabaseActive: false,
				primaryRedisCacheActive: false,
				primaryObjectStorageActive: false,
			};

			try {
				await prisma.$executeRaw`SELECT 1`;
				servicesStatus.primaryPostgresDatabaseActive = true;
			} catch {
				servicesStatus.primaryPostgresDatabaseActive = false;
			}

			try {
				await redis.ping('health-check-ping');
				servicesStatus.primaryRedisCacheActive = true;
			} catch {
				servicesStatus.primaryRedisCacheActive = false;
			}

			try {
				const { Buckets } = await awsS3.send(new ListBucketsCommand());
				const bucketNames = Buckets?.map((bucket) => bucket.Name) ?? [];

				const missingBuckets = AWS_BUCKET_NAMES.filter((bucket) => !bucketNames.includes(bucket));

				if (missingBuckets.length) {
					return createErrorResponse(
						'api-route',
						500,
						`Missing required S3 buckets: ${missingBuckets.join(', ')}`,
					);
				}

				servicesStatus.primaryObjectStorageActive = true;
			} catch {
				servicesStatus.primaryObjectStorageActive = false;
			}

			return createSuccessResponse('api-route', 'Dexbooru services statuses', servicesStatus);
		} catch (error) {
			return createErrorResponse('api-route', 500, (error as Error).message);
		}
	})) as ReturnType<RequestHandler>;
};
