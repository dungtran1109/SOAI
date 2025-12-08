import type { Role, SignupData } from '../../../shared/types/authTypes';

interface FormValues extends SignupData {
    confirmPassword: string;
    rememberMe: boolean;
    showPassword: boolean;
    showConfirmPassword: boolean;
    error: string;
}

type ActionReducer =
    | { type: 'RESET' }
    | { type: 'ROLE'; payload: Role }
    | { type: 'USER_NAME' | 'PASSWORD' | 'CONFIRM_PASSWORD' | 'EMAIL' | 'ERROR'; payload: string }
    | { type: 'REMEMBER_ME' | 'SHOW_PASSWORD' | 'SHOW_CONFIRM_PASSWORD'; payload: boolean };

export const initAuthFormValue: FormValues = {
    userName: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'USER',
    rememberMe: false,
    showPassword: false,
    showConfirmPassword: false,
    error: '',
};

export const authFormReducer = (state: FormValues, action: ActionReducer): FormValues => {
    switch (action.type) {
        case 'USER_NAME':
            return {
                ...state,
                userName: action.payload,
            };
        case 'PASSWORD':
            return {
                ...state,
                password: action.payload,
            };
        case 'CONFIRM_PASSWORD':
            return {
                ...state,
                confirmPassword: action.payload,
            };
        case 'EMAIL':
            return {
                ...state,
                email: action.payload,
            };
        case 'ROLE':
            return {
                ...state,
                role: action.payload,
            };
        case 'REMEMBER_ME':
            return {
                ...state,
                rememberMe: action.payload,
            };
        case 'SHOW_PASSWORD':
            return {
                ...state,
                showPassword: action.payload,
            };
        case 'SHOW_CONFIRM_PASSWORD':
            return {
                ...state,
                showConfirmPassword: action.payload,
            };
        case 'ERROR':
            return {
                ...state,
                error: action.payload,
            };
        case 'RESET':
            return initAuthFormValue;
        default:
            return state;
    }
};
