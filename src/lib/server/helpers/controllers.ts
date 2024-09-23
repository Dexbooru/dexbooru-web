import { error, fail } from "@sveltejs/kit";
import type { TControllerHandlerVariant } from "../types/controllers";

export const createErrorResponse = (handlerType: TControllerHandlerVariant, status: number, errorMessage: string, data: unknown = null) => {
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

export const createSuccessResponse = (handlerType: TControllerHandlerVariant, successMessage: string, data: unknown = null, status: number = 200) => {
    if (handlerType === 'api-route') {
        return new Response(JSON.stringify({ status, message: successMessage, data }), { status });
    }

    if (handlerType === 'form-action') {
        return { success: true, message: successMessage, ...(data as object) };
    }

    return data;
};