interface Filter {
    candidateName: string;
}

type FilterAction = { type: 'CANDIDATE_NAME'; payload: string };

export const initInterviewFilterValue: Filter = {
    candidateName: '',
};

export const interviewFilterReducer = (state: Filter, action: FilterAction): Filter => {
    switch (action.type) {
        case 'CANDIDATE_NAME':
            return { ...state, candidateName: action.payload };
        default:
            return state;
    }
};
