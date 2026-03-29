import type { RequestEvent } from '@sveltejs/kit';
import { findUserById } from '../../db/actions/user';
import { createErrorResponse } from '../../helpers/controllers';
import type { TControllerHandlerVariant } from '../../types/controllers';

export const handleOwnerRoleCheck = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	const user = await findUserById(event.locals.user.id, { role: true });
	if (!user) {
		return createErrorResponse(handlerType, 404, 'This user does not exist.');
	}

	if (user.role !== 'OWNER') {
		return createErrorResponse(handlerType, 403, 'This action is restricted to the site owner.');
	}
};
