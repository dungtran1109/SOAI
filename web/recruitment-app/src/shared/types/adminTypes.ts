import type { Role } from './authTypes';

export const STATUS = ['Pending', 'Accepted', 'Rejected'] as const;
export type Status = (typeof STATUS)[number];

export interface CandidateCV {
    id: number;
    email: string;
    username: string;
    datetime: string;
    candidate_name: string;
    position: string;
    status: Status;
    matched_score: number;
    justification: string;
}

export interface Account {
    accId: number;
    password: string;
    phoneNumber: string | null;
    role: Role;
    createAt: string;
    updateAt: string;
    userName: string;
    users: null;
}
