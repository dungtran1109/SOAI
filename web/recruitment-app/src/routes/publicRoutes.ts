import { PUBLIC_ROUTE } from '../shared/constants/routes';
import React from 'react';
import AuthPage from '../pages/AuthPage';

interface AuthRoute {
    id: number;
    path: string;
    component: React.ComponentType<{ isSignin: boolean }>;
    isSignin: boolean;
}

export const authRoutes: AuthRoute[] = [
    { id: 0, path: PUBLIC_ROUTE.signin, component: AuthPage, isSignin: true },
    { id: 1, path: PUBLIC_ROUTE.signup, component: AuthPage, isSignin: false },
];
