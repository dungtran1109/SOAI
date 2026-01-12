import { configureStore } from '@reduxjs/toolkit';
import authenReducer from './authSlices/authSlice';
import adminStatisticsReducer from './adminSlices/adminStatisticsSlice';
import chatReducer from './chatSlices/chatSlice';

export const store = configureStore({
    reducer: {
        authenSession: authenReducer,
        adminStatistics: adminStatisticsReducer,
        chatSession: chatReducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
