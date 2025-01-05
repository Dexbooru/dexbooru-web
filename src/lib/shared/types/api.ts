
export type TApiResponse<T> = {
    status: number;
    message: string;
    data: T;
}