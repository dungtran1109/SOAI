import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AdminStatistics {
    cvCount: number;
    jobCount: number;
    accountCount: number;
}

const initialState: AdminStatistics = {
    cvCount: 0,
    jobCount: 0,
    accountCount: 0,
};

export const adminStatisticsSlice = createSlice({
    name: 'admin-dashboard-statistics',
    initialState,
    reducers: {
        setNumberOfCV: (state, action: PayloadAction<number>): AdminStatistics => {
            return {
                ...state,
                cvCount: action.payload,
            };
        },

        setNumberOfJob: (state, action: PayloadAction<number>): AdminStatistics => {
            return {
                ...state,
                jobCount: action.payload,
            };
        },

        setNumberOfAccount: (state, action: PayloadAction<number>): AdminStatistics => {
            return {
                ...state,
                accountCount: action.payload,
            };
        },
    },
});

export const { setNumberOfCV, setNumberOfJob, setNumberOfAccount } = adminStatisticsSlice.actions;

export default adminStatisticsSlice.reducer;
