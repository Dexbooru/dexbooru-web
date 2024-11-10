import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { error, fail, type RequestEvent } from '@sveltejs/kit';
import type { z } from 'zod';
import type {
	TControllerHandlerVariant,
	TInferRequestSchema,
	TRequestData,
	TRequestSchema,
	TValidationError,
	TValidationResult,
} from '../types/controllers';
import { getUserClaimsFromEncodedJWTToken } from './sessions';

const parts: (keyof TRequestSchema)[] = ['form', 'urlSearchParams', 'pathParams', 'body'];
const formContentTypes = ['multipart/form-data', 'application/x-www-form-urlencoded'];

export const populateAuthenticatedUser = (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	let userJwtTokenEncoded: string | null = null;

	event.locals.user = NULLABLE_USER;

	if (handlerType === 'api-route') {
		const authHeader = event.request.headers.get('Authorization');
		if (!authHeader) return false;

		const authHeaderParts = authHeader.split('Bearer ');
		if (authHeaderParts.length < 2) return false;

		userJwtTokenEncoded = authHeaderParts[1].trim();
	} else {
		userJwtTokenEncoded = event.cookies.get(SESSION_ID_KEY) ?? null;
	}

	if (userJwtTokenEncoded) {
		const sessionUser = getUserClaimsFromEncodedJWTToken(userJwtTokenEncoded);
		if (!sessionUser) {
			return false;
		}

		event.locals.user = sessionUser;
		return true;
	}

	return false;
};

const validatePart = <K extends keyof TRequestSchema>(
	key: K,
	schema: z.ZodType | undefined,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): TValidationResult<any> => {
	if (!schema) {
		return { success: true, data: undefined };
	}

	const parseResult = schema.safeParse(data);
	if (parseResult.success) {
		return { success: true, data: parseResult.data };
	}

	return {
		success: false,
		errors: parseResult.error.errors.map((error) => ({
			path: [key, ...error.path],
			message: error.message,
			code: error.code,
		})),
	};
};

const parseKeyValueStore = (store: FormData | URLSearchParams): Record<string, unknown> => {
	const parsedObject: Record<string, unknown> = {};

	for (const key of store.keys()) {
		const values = store.getAll(key);
		if (values.length > 1) {
			parsedObject[key] = values;
		} else {
			parsedObject[key] = values[0];
		}
	}

	return parsedObject;
};

const parseRequestBodies = async (event: RequestEvent, isFormContentType: string | undefined) => {
	let formData: FormData;
	let body: unknown;

	try {
		formData = isFormContentType ? await event.request.formData() : new FormData();
	} catch {
		formData = new FormData();
	}

	try {
		body = await event.request.json().catch(() => {});
	} catch {
		body = {};
	}

	return {
		formData,
		body,
	};
};

const validateRequest = <T extends TRequestSchema>(
	rawRequestData: TRequestData,
	requestSchema: T,
): TValidationResult<TInferRequestSchema<T>> => {
	const result: Partial<TInferRequestSchema<T>> = {};
	const errors: TValidationError[] = [];

	for (const part of parts) {
		const partSchema = requestSchema[part];
		const partData =
			part === 'form' || part === 'urlSearchParams'
				? parseKeyValueStore(rawRequestData[part])
				: rawRequestData[part];

		const partResult = validatePart(part, partSchema, partData);

		if (partResult.success) {
			if (partResult.data !== undefined) {
				result[part] = partResult.data;
			}
		} else {
			errors.push(...partResult.errors);
		}
	}

	if (errors.length > 0) {
		return { success: false, errors };
	}

	return { success: true, data: result as TInferRequestSchema<T> };
};

export const validateAndHandleRequest = async <T extends TRequestSchema>(
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
	requestSchema: T,
	// eslint-disable-next-line no-unused-vars
	callback: (validatedData: TInferRequestSchema<T>) => Promise<unknown>,
	isProtected: boolean = false,
) => {
	if (isProtected && event.locals.user.id === NULLABLE_USER.id) {
		const authErrorMessage =
			handlerType === 'api-route'
				? 'The authorization header was either missing or containing an invalid token'
				: 'The token cookie was either missing or containing an invalid token';
		return createErrorResponse(handlerType, 401, authErrorMessage);
	}

	const requestContentType = event.request.headers.get('Content-Type') ?? '';
	const isFormContentType = formContentTypes.find((formContentType) =>
		requestContentType.trim().toLocaleLowerCase().includes(formContentType),
	);

	const { formData, body } = await parseRequestBodies(event, isFormContentType);
	const rawRequestData: TRequestData = {
		form: formData,
		urlSearchParams: event.url.searchParams,
		pathParams: event.params,
		body: body,
	};

	const validationResult = validateRequest(rawRequestData, requestSchema);
	if (!validationResult.success) {
		return createErrorResponse(
			handlerType,
			400,
			'Request validation for this endpoint failed',
			validationResult.errors,
		);
	}

	return await callback(validationResult.data);
};

export const createErrorResponse = (
	handlerType: TControllerHandlerVariant,
	status: number,
	errorMessage: string,
	data: unknown = null,
) => {
	if (handlerType === 'api-route') {
		return new Response(JSON.stringify({ status, message: errorMessage, data }), { status });
	}

	if (handlerType === 'form-action') {
		return fail(status, {
			message: errorMessage,
			...(data as object),
		});
	}

	return error(status, { message: errorMessage });
};

export const createSuccessResponse = (
	handlerType: TControllerHandlerVariant,
	successMessage: string,
	data: unknown = null,
	status: number = 200,
) => {
	if (handlerType === 'api-route') {
		return new Response(JSON.stringify({ status, message: successMessage, data }), { status });
	}

	if (handlerType === 'form-action') {
		return { success: true, message: successMessage, ...(data as object) };
	}

	return data;
};
