
export interface ICoreApiResponse<T = unknown> { 
    type?: string;
    reason?: string;
    data?: T;
};

export type TChatRoom = {   
    id: string; 
    createdAt: number;
    updatedAt: number;
    participants: string[];
};