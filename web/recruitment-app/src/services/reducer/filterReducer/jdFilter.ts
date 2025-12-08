interface Filter {
    jd_title: string;
}

type FilterAction = { type: 'JD_TITLE'; payload: string };

export const initJDFilterValue: Filter = {
    jd_title: '',
};

export const jdFilterReducer = (state: Filter, action: FilterAction): Filter => {
    switch (action.type) {
        case 'JD_TITLE':
            return {
                ...state,
                jd_title: action.payload,
            };
        default:
            return state;
    }
};
