export const PRIVATE_ADMIN_ROUTE = {
    dashboard: '/admin/dashboard',
    user: '/admin/users',
    candidateCV: '/admin/candidate/cvs',
    candidateInterview: '/admin/candidate/interviews',
    job: '/admin/dashboard/job/description',
} as const;

export const PUBLIC_ROUTE = {
    signin: '/signin',
    signup: '/signup',
} as const;
