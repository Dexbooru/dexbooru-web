import { isModerationRole } from '$lib/shared/helpers/auth/role';
import type { RequestEvent } from '@sveltejs/kit';
import { findUserById } from '../../db/actions/user';
import { createErrorResponse } from '../../helpers/controllers';
import type { TControllerHandlerVariant } from '../../types/controllers';

export const handleModerationRoleCheck = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	const user = await findUserById(event.locals.user.id, { role: true });
	if (!user) {
		return createErrorResponse(handlerType, 404, 'This user does not exist.');
	}

	if (!isModerationRole(user.role)) {
		return createErrorResponse(
			handlerType,
			403,
			'You do not have permission to delete post reports.',
		);
	}
};
