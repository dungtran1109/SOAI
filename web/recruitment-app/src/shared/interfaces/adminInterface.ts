export interface CandidateCV {
    id: number;
    email: string;
    username: string;
    datetime: string;
    candidate_name: string;
    position: string;
    status: 'Accepted' | 'Rejected' | 'Pending';
    matched_score: number;
    justification: string;
}
