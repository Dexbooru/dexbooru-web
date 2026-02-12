import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import type { RequestEvent } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { buildCookieOptions } from '../../helpers/cookies';
import { getUserClaimsFromEncodedJWTToken } from '../../helpers/sessions';
import { OauthStoreSchema } from '../request-schemas/oauth';

export const handleOauthStorage = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'api-route', OauthStoreSchema, async (data) => {
		const token = data.body.token;
		const validatedUser = getUserClaimsFromEncodedJWTToken(token);
		if (!validatedUser) {
			return createErrorResponse('api-route', 401, 'Invalid token');
		}

		event.cookies.set(
			SESSION_ID_KEY,
			token,
			buildCookieOptions(true) as SerializeOptions & { path: string },
		);

		return createSuccessResponse(
			'api-route',
			`Successfully stored token for user with the id: ${validatedUser.id}`,
		);
	});
};
