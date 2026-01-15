import { PRIVATE_ADMIN_ROUTE, PUBLIC_ROUTE } from '../shared/constants/routes';
import type { Role } from '../shared/types/authTypes';
import React from 'react';
import AdminDashBoardPage from '../pages/AdminDashBoardPage';
import AdminInterviewPage from '../pages/AdminInterviewPage';
import AdminCVPage from '../pages/AdminCVPage';
import AdminJDPage from '../pages/AdminJDPage';
import AdminAccountPage from '../pages/AdminAccountPage';
import ChatPage from '../pages/ChatPage';
import UserProfile from '../pages/UserProfilePage';
import UserJobPage from '../pages/UserJobPage';

interface Route {
    id: number;
    path: string;
    component: React.FC;
}

interface ProtectedRoute {
    role: Role;
    routes: Route[];
}

export const adminRoute: ProtectedRoute = {
    role: 'ADMIN',
    routes: [
        { id: 0, path: PRIVATE_ADMIN_ROUTE.dashboard, component: AdminDashBoardPage },
        { id: 1, path: PRIVATE_ADMIN_ROUTE.interview, component: AdminInterviewPage },
        { id: 2, path: PRIVATE_ADMIN_ROUTE.cv, component: AdminCVPage },
        { id: 3, path: PRIVATE_ADMIN_ROUTE.job, component: AdminJDPage },
        { id: 4, path: PRIVATE_ADMIN_ROUTE.account, component: AdminAccountPage },
        { id: 5, path: PRIVATE_ADMIN_ROUTE.aiAssistant, component: ChatPage },
    ],
};

export const userRoute: ProtectedRoute = {
    role: 'USER',
    routes: [
        { id: 0, path: PUBLIC_ROUTE.profile, component: UserProfile },
        { id: 1, path: PUBLIC_ROUTE.openJob, component: UserJobPage },
    ],
};
