import React, { useReducer } from 'react';
import { toast } from 'react-toastify';
import { Col, Row } from '../layouts';
import type { JD } from '../../shared/types/adminTypes';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminJDForm.module.scss';

const cx = classNames.bind(styles);

interface AdminJDFormProps {
    jd?: JD; // Passing JD data to AdminJDForm for editing.
    onSubmit: (jd: JD) => void;
    onCancel: () => void;
}

const initEditJDValue: JD = {} as JD;

type EditJDFormAction =
    | {
          type:
              | 'JOB_DESCRIPTION'
              | 'LEVEL'
              | 'POSISION'
              | 'LOCATION'
              | 'RECRUITER'
              | 'REFERAL_CODE'
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

const editJDReducer = (state: JD, action: EditJDFormAction): JD => {
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
        case 'POSISION':
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
        case 'REFERAL_CODE':
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

const AdminJDForm = ({ jd = initEditJDValue, onSubmit, onCancel }: AdminJDFormProps) => {
    const [editJD, dispatchEditJD] = useReducer(editJDReducer, JSON.parse(JSON.stringify(jd)));

    const handleSubmitEditJD = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (JSON.stringify(jd) === JSON.stringify(editJD)) {
            toast.warning('No changes detected!', {
                position: 'top-center',
                hideProgressBar: true,
            });
        } else if (Object.keys(editJD).length > 0) {
            dispatchEditJD({ type: 'RESET_EDIT' });
            onSubmit(editJD);
        }
    };

    const handleCancelEditJD = () => {
        if (JSON.stringify(jd) === JSON.stringify(editJD) || window.confirm('Do you want to leave without saving the changes?')) {
            dispatchEditJD({ type: 'RESET_EDIT' });
            onCancel();
        }
    };

    return (
        <form className={cx('edit-jd-form')} onSubmit={handleSubmitEditJD}>
            <Row space={20}>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('edit-jd-form__group')}>
                        <label htmlFor="position-title" className={cx('edit-jd-form__group-label')}>
                            Position
                        </label>
                        <input
                            id="position-title"
                            type="text"
                            required
                            value={editJD.position}
                            onChange={(e) => dispatchEditJD({ type: 'POSISION', payload: e.target.value })}
                            className={cx('edit-jd-form__group-entry')}
                        />
                    </div>
                </Col>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('edit-jd-form__group')}>
                        <label htmlFor="position-level" className={cx('edit-jd-form__group-label')}>
                            Level
                        </label>
                        <input
                            id="position-level"
                            type="text"
                            required
                            value={editJD.level}
                            onChange={(e) => dispatchEditJD({ type: 'LEVEL', payload: e.target.value })}
                            className={cx('edit-jd-form__group-entry')}
                        />
                    </div>
                </Col>
            </Row>

            <Row space={20}>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('edit-jd-form__group')}>
                        <label htmlFor="work-location" className={cx('edit-jd-form__group-label')}>
                            Location
                        </label>
                        <input
                            id="work-location"
                            type="text"
                            required
                            value={editJD.location}
                            onChange={(e) => dispatchEditJD({ type: 'LOCATION', payload: e.target.value })}
                            className={cx('edit-jd-form__group-entry')}
                        />
                    </div>
                </Col>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('edit-jd-form__group')}>
                        <label htmlFor="expire-date" className={cx('edit-jd-form__group-label')}>
                            Expiration
                        </label>
                        <input
                            id="expire-date"
                            type="date"
                            required
                            // TODO: Use expire date instead
                            value={editJD.datetime}
                            onChange={(e) => dispatchEditJD({ type: 'DATE_TIME', payload: e.target.value })}
                            className={cx('edit-jd-form__group-entry')}
                        />
                    </div>
                </Col>
            </Row>

            <Row space={20}>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('edit-jd-form__group')}>
                        <label htmlFor="experience-required" className={cx('edit-jd-form__group-label')}>
                            Years of Experience
                        </label>
                        <input
                            id="experience-required"
                            type="number"
                            required
                            value={editJD.experience_required}
                            onChange={(e) => dispatchEditJD({ type: 'EXPERIENCE_REQUIRED', payload: Number(e.target.value) })}
                            min={0}
                            className={cx('edit-jd-form__group-entry')}
                        />
                    </div>
                </Col>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('edit-jd-form__group')}>
                        <label htmlFor="referal-code" className={cx('edit-jd-form__group-label')}>
                            Referal code
                        </label>
                        <input
                            id="referal-code"
                            type="text"
                            value={editJD.referral_code}
                            onChange={(e) => dispatchEditJD({ type: 'REFERAL_CODE', payload: e.target.value })}
                            className={cx('edit-jd-form__group-entry')}
                        />
                    </div>
                </Col>
            </Row>

            <Row space={20}>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('edit-jd-form__group')}>
                        <label htmlFor="recruiter" className={cx('edit-jd-form__group-label')}>
                            Recruiter
                        </label>
                        <input
                            id="recruiter"
                            type="text"
                            required
                            value={editJD.recruiter}
                            onChange={(e) => dispatchEditJD({ type: 'RECRUITER', payload: e.target.value })}
                            className={cx('edit-jd-form__group-entry')}
                        />
                    </div>
                </Col>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('edit-jd-form__group')}>
                        <label htmlFor="hiring-manager" className={cx('edit-jd-form__group-label')}>
                            Approved Manager
                        </label>
                        <input
                            id="hiring-manager"
                            type="text"
                            required
                            value={editJD.hiring_manager}
                            onChange={(e) => dispatchEditJD({ type: 'HIRING_MANAGER', payload: e.target.value })}
                            className={cx('edit-jd-form__group-entry')}
                        />
                    </div>
                </Col>
            </Row>

            <div className={cx('edit-jd-form__group')}>
                <label htmlFor="qualifications" className={cx('edit-jd-form__group-label')}>
                    Qualifications
                </label>
                <textarea
                    id="qualifications"
                    required
                    value={editJD.qualifications?.join('\n')}
                    onChange={(e) => dispatchEditJD({ type: 'QUALIFICATIONS', payload: e.target.value })}
                    className={cx('edit-jd-form__group-entry')}
                />
            </div>

            <div className={cx('edit-jd-form__group')}>
                <label htmlFor="job-description" className={cx('edit-jd-form__group-label')}>
                    Job Description
                </label>
                <textarea
                    id="job-description"
                    required
                    value={editJD.job_description}
                    onChange={(e) => dispatchEditJD({ type: 'JOB_DESCRIPTION', payload: e.target.value })}
                    className={cx('edit-jd-form__group-entry')}
                />
            </div>

            <div className={cx('edit-jd-form__group')}>
                <label htmlFor="skill-required" className={cx('edit-jd-form__group-label')}>
                    Responsibilities
                </label>
                <textarea
                    id="skill-required"
                    required
                    value={editJD.responsibilities?.join('\n')}
                    onChange={(e) => dispatchEditJD({ type: 'RESPONSIBILITIES', payload: e.target.value })}
                    className={cx('edit-jd-form__group-entry')}
                />
            </div>

            <div className={cx('edit-jd-form__group')}>
                <label htmlFor="skill-required" className={cx('edit-jd-form__group-label')}>
                    Required Skills
                </label>
                <textarea
                    id="skill-required"
                    required
                    value={editJD.skills_required?.join('\n')}
                    onChange={(e) => dispatchEditJD({ type: 'SKILLS_REQUIRED', payload: e.target.value })}
                    className={cx('edit-jd-form__group-entry')}
                />
            </div>

            <div className={cx('edit-jd-form__group')}>
                <label htmlFor="about-company" className={cx('edit-jd-form__group-label')}>
                    About Company
                </label>
                <textarea
                    id="about-company"
                    value={editJD.company_description}
                    onChange={(e) => dispatchEditJD({ type: 'COMPANY_DESCRIPTION', payload: e.target.value })}
                    className={cx('edit-jd-form__group-entry')}
                />
            </div>

            <div className={cx('form-action')}>
                <button type="submit" className={cx('form-action__btn', 'form-action__btn--submit')}>
                    Submit
                </button>
                <button type="reset" className={cx('form-action__btn', 'form-action__btn--cancel')} onClick={handleCancelEditJD}>
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default AdminJDForm;
