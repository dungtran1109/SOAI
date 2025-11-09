export const ROLES = ['ADMIN', 'USER'] as const;
export type Role = (typeof ROLES)[number];

export interface SignInData {
    userName: string;
    password: string;
}

export interface SignUpData extends SignInData {
    email: string;
    role: Role;
}

export interface TokenDecoded {
    exp: number;
    iat: number;
    sub: number;
    role: Role;
}
