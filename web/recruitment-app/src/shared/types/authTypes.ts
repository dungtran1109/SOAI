export const ROLES = ['ADMIN', 'USER'] as const;
export type Role = (typeof ROLES)[number];

export interface SigninData {
    userName: string;
    password: string;
}

export interface SignupData extends SigninData {
    email: string;
    role: Role;
}

export interface SigninResponse {
    expiresAt: string;
    token: string;
    tokenType: string;
}

export interface TokenDecoded {
    exp: number;
    iat: number;
    sub: string;
    role: Role;
}
