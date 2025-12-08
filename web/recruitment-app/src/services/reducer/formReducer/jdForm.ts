import type { JD } from '../../../shared/types/adminTypes';

type EditJDFormAction =
    | {
          type:
              | 'JOB_DESCRIPTION'
              | 'LEVEL'
              | 'POSITION'
              | 'LOCATION'
              | 'RECRUITER'
              | 'REFERRAL_CODE'
              | 'DATE_TIME'
              | 'HIRING_MANAGER'
              | 'COMPANY_DESCRIPTION'
              | 'QUALIFICATIONS'
              | 'RESPONSIBILITIES'
              | 'SKILLS_REQUIRED';
          payload: string;
      }
    | { type: 'EXPERIENCE_REQUIRED'; payload: number }
    | { type: 'SET_EDIT_JD'; payload: JD }
    | { type: 'RESET_EDIT' };

// TO FIX: Add initital properties & set values to avoid the uncontrolled input issue
export const initJDFormValue: JD = {} as JD;

export const jdFormReducer = (state: JD, action: EditJDFormAction): JD => {
    switch (action.type) {
        case 'JOB_DESCRIPTION':
            return {
                ...state,
                job_description: action.payload,
            };
        case 'LEVEL':
            return {
                ...state,
                level: action.payload,
            };
        case 'POSITION':
            return {
                ...state,
                position: action.payload,
            };
        case 'LOCATION':
            return {
                ...state,
                location: action.payload,
            };
        case 'RECRUITER':
            return {
                ...state,
                recruiter: action.payload,
            };
        case 'REFERRAL_CODE':
            return {
                ...state,
                referral_code: action.payload,
            };
        case 'DATE_TIME':
            return {
                ...state,
                datetime: action.payload,
            };
        case 'HIRING_MANAGER':
            return {
                ...state,
                hiring_manager: action.payload,
            };
        case 'COMPANY_DESCRIPTION':
            return {
                ...state,
                company_description: action.payload,
            };
        case 'EXPERIENCE_REQUIRED':
            return {
                ...state,
                experience_required: action.payload,
            };
        case 'QUALIFICATIONS':
            return {
                ...state,
                qualifications: action.payload.split('\n'),
            };
        case 'RESPONSIBILITIES':
            return {
                ...state,
                responsibilities: action.payload.split('\n'),
            };
        case 'SKILLS_REQUIRED':
            return {
                ...state,
                skills_required: action.payload.split('\n'),
            };
        case 'SET_EDIT_JD':
            return JSON.parse(JSON.stringify(action.payload));
        case 'RESET_EDIT':
            return {} as JD;
        default:
            return state;
    }
};
