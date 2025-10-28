export type Role = 'USER' | 'ADMIN';

export interface SignInData {
    userName: string;
    password: string;
}

export interface SignUpData extends SignInData {
    email: string;
    role: Role;
}

export interface DecodedToken {
    exp: number;
    iat: number;
    sub: number;
    role: Role;
}
