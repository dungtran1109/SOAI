import { PUBLIC_ROUTE } from '../shared/constants/routes';
import React from 'react';
import AuthPage from '../pages/AuthPage';
import NotFoundPage from '../pages/NotFoundPage';

interface Route {
    id: number;
    path: string;
    component: React.FC;
}
interface AuthRoute extends Omit<Route, 'component'> {
    component: React.ComponentType<{ isSignin: boolean }>;
    isSignin: boolean;
}

export const authRoutes: AuthRoute[] = [
    { id: 0, path: PUBLIC_ROUTE.signin, component: AuthPage, isSignin: true },
    { id: 1, path: PUBLIC_ROUTE.signup, component: AuthPage, isSignin: false },
];

export const publicRoutes: Route[] = [{ id: 0, path: PUBLIC_ROUTE.notFound, component: NotFoundPage }];
