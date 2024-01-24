import { PROTECTED_API_ENDPOINT_ROUTE_PREFIX, PROTECTED_FORM_ROUTES } from "../constants/auth";

export const isProtectedRoute = (url: URL, requestMethod: string): boolean => {
    const currentRoute = url.pathname;
    const isProtectedApiEndpoint = currentRoute.startsWith(PROTECTED_API_ENDPOINT_ROUTE_PREFIX);
    const isProtectedFormEndpoint = !!PROTECTED_FORM_ROUTES.find(routeData => {
        const { route, methods } = routeData;
        return currentRoute.startsWith(route) && methods.includes(requestMethod);
    })

    return isProtectedApiEndpoint || isProtectedFormEndpoint;
};
