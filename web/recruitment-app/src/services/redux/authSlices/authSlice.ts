import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getUserRole, isAuthenticated, logout } from '../../../shared/helpers/authUtils';
import type { Role } from '../../../shared/types/authTypes';

export interface Authen {
    isAuthen: boolean;
    role: Role | null;
}

const initialState: Authen = {
    isAuthen: isAuthenticated(),
    role: getUserRole(),
};

export const authenSlice = createSlice({
    name: 'authentication',
    initialState,
    reducers: {
        setUserLogin: (state, action: PayloadAction<Authen>): Authen => {
            return {
                ...state,
                ...action.payload,
            };
        },
        setUserLogout: (): Authen => {
            logout();
            return {
                isAuthen: false,
                role: null,
            };
        },
    },
});

export const { setUserLogin, setUserLogout } = authenSlice.actions;

export default authenSlice.reducer;
