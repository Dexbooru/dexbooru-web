import type { IDeletePostBody } from "$lib/shared/types/posts";

export const deletePost = async (body: IDeletePostBody): Promise<Response> => {
    return await fetch('/api/posts/delete', {
        method: 'DELETE',
        body: JSON.stringify(body),
    });
};