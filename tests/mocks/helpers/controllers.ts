import { vi } from 'vitest';

export const mockControllerHelpers = {
	validateAndHandleRequest: vi.fn(),
	createErrorResponse: vi.fn().mockImplementation((handlerType, status, message, data) => {
		if (handlerType === 'api-route') {
			return { status, message, data };
		}
		return { status, message, data, __isErrorResponse: true };
	}),
	createSuccessResponse: vi.fn().mockImplementation((handlerType, message, data, status = 200) => {
		if (handlerType === 'api-route') {
			return { status, message, data };
		}
		return { success: true, message, data, status };
	}),
};

vi.mock('$lib/server/helpers/controllers', async (importActual) => {
	const actual = (await importActual()) as Record<string, unknown>;
	return {
		...actual,
		validateAndHandleRequest: mockControllerHelpers.validateAndHandleRequest,
		createErrorResponse: mockControllerHelpers.createErrorResponse,
		createSuccessResponse: mockControllerHelpers.createSuccessResponse,
	};
});
