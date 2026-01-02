import type { CV } from './adminTypes';

interface Certificate {
    credential_id: number | number;
    date: string;
    issuer: string;
    name: string;
}

interface Education {
    country: string;
    degree: string;
    end_date: string;
    gpa: number | null;
    gpa_scale: number | null;
    institution: string;
    major: string;
    start_date: string;
}

interface Language {
    language: string;
    proficiency_cefr: string;
}

interface UniversityEvaluation {
    best_institution: string;
    confidence: number;
    estimated_score: number;
    rank_tier: string;
    rationale: string;
}

interface ParsedCV {
    certifications: Certificate[];
    cv_file_name: string;
    education: Education[];
    email: string;
    experience_years: number;
    highest_degree_level: string;
    languages: Language[];
    name: string;
    skills: string[];
    university_evaluation: UniversityEvaluation;
}

export interface AppliedJob extends CV {
    experience_years: number;
    jd_skills: string[];
    skills: string[];
    parsed_cv: ParsedCV;
}
