export type TS3ObjectSource = 'posts' | 'profile_pictures' | 'collections';

export type TPostImageSqsMessage = {
    postId: string;
    imageUrl: string;
}