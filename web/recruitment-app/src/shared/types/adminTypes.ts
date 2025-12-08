import type { Role } from './authTypes';

export const STATUS = ['Pending', 'Accepted', 'Rejected'] as const;
export type Status = (typeof STATUS)[number];

export interface CV {
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

export interface Interview {
    id: number;
    cv_application_id: number;
    candidate_name: string;
    interview_datetime: string;
    interviewer_name: string;
    status: Status;
}

export interface InterviewSchedule extends CV {
    interviewer_name: string;
    interview_datetime: string;
    interview_location: string;
}

export interface InterviewSession extends Interview {
    interview_comment: string;
}

export interface InterviewQuestion {
    id: number;
    cv_application_id: number;
    original_question: string;
    edited_question: string | null;
    is_edited: boolean;
    answer: string;
    source: string;
}
