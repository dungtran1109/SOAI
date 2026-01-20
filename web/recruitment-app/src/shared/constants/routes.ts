export const PRIVATE_ADMIN_ROUTE = {
    dashboard: '/admin/dashboard',
    job: '/admin/job/descriptions',
    interview: '/admin/candidate/interviews',
    cv: '/admin/candidate/cvs',
    account: '/admin/accounts',
    aiAssistant: '/soai-support',
} as const;

export const PRIVATE_USER_ROUTE = {
    openJob: '/open-job',
    profile: '/user-profile',
};

export const PUBLIC_ROUTE = {
    notFound: '*',
    signin: '/signin',
    signup: '/signup',
} as const;
