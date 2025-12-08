import { ROLES, type Role } from '../../../shared/types/authTypes';

interface Filter {
    userName: string;
    roles: Role[];
}

type FilterAction = { type: 'USERNAME'; payload: string } | { type: 'ROLE'; payload: Role };

export const initAccountFilterValue: Filter = {
    userName: '',
    roles: [...ROLES],
};

export const accountFilterReducer = (state: Filter, action: FilterAction): Filter => {
    switch (action.type) {
        case 'USERNAME':
            return {
                ...state,
                userName: action.payload,
            };
        case 'ROLE':
            return {
                ...state,
                roles: state.roles.includes(action.payload) ? state.roles.filter((role) => role !== action.payload) : [...state.roles, action.payload],
            };
        default:
            return state;
    }
};
