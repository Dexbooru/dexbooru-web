import type { z } from 'zod';

export type TControllerHandlerVariant = 'form-action' | 'api-route' | 'page-server-load';
export type TPostFetchCategory = 'general' | 'uploaded' | 'liked';

export type TRequestData = {
    form: FormData;
    urlSearchParams: URLSearchParams;
    pathParams: Partial<Record<string, string>>;
    body: unknown;
}

export type TRequestSchema<
    F extends z.ZodType = z.ZodType,
    U extends z.ZodType = z.ZodType,
    P extends z.ZodType = z.ZodType,
    B extends z.ZodType = z.ZodType
> = {
    form?: F;
    urlSearchParams?: U;
    pathParams?: P;
    body?: B;
};

export type TInferRequestSchema<T extends TRequestSchema> = {
    form: T['form'] extends z.ZodType ? z.infer<T['form']> : never;
    urlSearchParams: T['urlSearchParams'] extends z.ZodType ? z.infer<T['urlSearchParams']> : never;
    pathParams: T['pathParams'] extends z.ZodType ? z.infer<T['pathParams']> : never;
    body: T['body'] extends z.ZodType ? z.infer<T['body']> : never;
};

export type TValidationError = {
    path: (string | number)[];
    message: string;
    code: z.ZodIssue['code']
};


export type TValidationResult<T> =
    | { success: true; data: T }
    | { success: false; errors: TValidationError[] };