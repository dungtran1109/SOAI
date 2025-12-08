import { STATUS, type Status } from '../../../shared/types/adminTypes';

interface Filter {
    sortBy: 'ASCENDING' | 'DESCENDING';
    candidateName: string;
    positions: string[];
    status: Status[];
    minimumScore: number;
}

type FilterAction =
    | { type: 'SORT_BY'; payload: 'ASCENDING' | 'DESCENDING' }
    | { type: 'CANDIDATE_NAME'; payload: string }
    | { type: 'POSITION'; payload: string | string[] }
    | { type: 'MINIMUM_SCORE'; payload: number }
    | { type: 'STATUS'; payload: Status };

export const initCVFilterValue: Filter = {
    sortBy: 'DESCENDING',
    candidateName: '',
    positions: [],
    status: [...STATUS],
    minimumScore: 0,
};

export const cvFilterReducer = (state: Filter, action: FilterAction): Filter => {
    switch (action.type) {
        case 'SORT_BY':
            return { ...state, sortBy: action.payload };
        case 'CANDIDATE_NAME':
            return { ...state, candidateName: action.payload };
        case 'POSITION':
            // Support loading a position list at the first time
            if (Array.isArray(action.payload)) {
                return {
                    ...state,
                    positions: [...action.payload],
                };
            }
            // Sub or add a position at the next times
            return {
                ...state,
                positions: state.positions.includes(action.payload)
                    ? state.positions.filter((pos) => pos !== action.payload)
                    : [...state.positions, action.payload],
            };
        case 'STATUS':
            return {
                ...state,
                status: state.status.includes(action.payload) ? state.status.filter((status) => status !== action.payload) : [...state.status, action.payload],
            };
        case 'MINIMUM_SCORE':
            return { ...state, minimumScore: action.payload };
        default:
            return state;
    }
};
