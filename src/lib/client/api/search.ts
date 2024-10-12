import { buildUrl } from "$lib/client/helpers/urls"

export const getGlobalSearchResults = async (query: string): Promise<Response> => {    
    const searchUrl = buildUrl('/api/search', { query });
    return await fetch(searchUrl);
}