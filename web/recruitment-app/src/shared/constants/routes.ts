export const PRIVATE_ADMIN_ROUTE = {
    dashboard: '/admin/dashboard',
    account: '/admin/accounts',
    cv: '/admin/candidate/cvs',
    job: '/admin/dashboard/job/descriptions',
    interview: '/admin/candidate/interviews',
} as const;

export const PUBLIC_ROUTE = {
    signin: '/signin',
    signup: '/signup',
    openJob: '/open-job',
} as const;
