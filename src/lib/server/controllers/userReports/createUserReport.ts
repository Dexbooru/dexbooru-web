import type { RequestEvent } from '@sveltejs/kit';
import { findUserByName } from '../../db/actions/user';
import { createUserReport } from '../../db/actions/userReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { CreateUserReportSchema } from '../request-schemas/userReports';

export const handleCreateUserReport = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		CreateUserReportSchema,
		async (data) => {
			const username = data.pathParams.username;
			const { description, category } = data.body;

			try {
				const user = await findUserByName(username, { id: true });
				if (!user) {
					return createErrorResponse(
						'api-route',
						404,
						'The user you are trying to report does not exist.',
					);
				}

				const newUserReport = await createUserReport({
					description,
					category,
					userId: user.id,
				});

				return createSuccessResponse(
					'api-route',
					'Successfully created the user report.',
					{ newUserReport },
					201,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while creating the user report.',
				);
			}
		},
	);
};
