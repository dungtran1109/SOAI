export type AppType = 'ALL' | 'RECRUITMENT' | 'COMMUNICATION' | 'STORAGE' | 'DESIGN';
export const APP_TYPES: AppType[] = ['ALL', 'RECRUITMENT', 'COMMUNICATION', 'STORAGE', 'DESIGN'] as const;

interface App {
    id: number;
    name: string;
    description: string;
    path: string;
    type: AppType;
}

export const APPS: App[] = [
    { id: 0, name: 'Recruitment', description: 'Smart recruiment for candidate & employee.', path: '/recruitment', type: 'RECRUITMENT' },
    { id: 1, name: 'GitHub', description: 'Repos & pull requests', path: '#', type: 'STORAGE' },
    { id: 2, name: 'Slack', description: 'Team messaging', path: '#', type: 'COMMUNICATION' },
    { id: 3, name: 'Figma', description: 'Design collaboration', path: '#', type: 'DESIGN' },
    { id: 4, name: 'Google Drive', description: 'Docs & files', path: '#', type: 'STORAGE' },
];
