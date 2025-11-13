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

export interface JD {
    id: number;
    job_description: string;
    level: string;
    position: string;
    location: string;
    qualifications: string[];
    recruiter: string;
    referral: boolean;
    referral_code: string;
    responsibilities: string[];
    skills_required: string[];
    datetime: string;
    experience_required: number;
    hiring_manager: string;
    company_description: string;
    additional_information: string;
}
