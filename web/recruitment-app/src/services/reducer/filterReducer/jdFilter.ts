interface Filter {
    title: string;
    location: string;
}

type FilterAction = { type: 'JD_TITLE' | 'JD_LOCATION'; payload: string };

export const initJDFilterValue: Filter = {
    title: '',
    location: '',
};

export const jdFilterReducer = (state: Filter, action: FilterAction): Filter => {
    switch (action.type) {
        case 'JD_TITLE':
            return {
                ...state,
                title: action.payload,
            };
        case 'JD_LOCATION':
            return {
                ...state,
                location: action.payload === '-- All --' ? '' : action.payload,
            };
        default:
            return state;
    }
};
