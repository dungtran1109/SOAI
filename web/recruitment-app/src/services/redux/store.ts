import { configureStore } from '@reduxjs/toolkit';
import adminStatisticsReducer from './adminSlices/adminStatisticsSlice';

export const store = configureStore({
    reducer: {
        adminStatistics: adminStatisticsReducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
