import React, { useReducer } from 'react';
import { toast } from 'react-toastify';
import { Col, Row } from '../layouts';
import { initJDFormValue, jdFormReducer } from '../../services/reducer/formReducer/jdForm';
import type { JD } from '../../shared/types/adminTypes';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminJDForm.module.scss';

const cx = classNames.bind(styles);

interface AdminJDFormProps {
    jd?: JD; // Passing JD data to AdminJDForm for editing if any.
    onSubmit: (jd: JD) => void;
    onCancel: () => void;
}

const AdminJDForm = ({ jd = initJDFormValue, onSubmit, onCancel }: AdminJDFormProps) => {
    const [editJD, dispatchEditJD] = useReducer(jdFormReducer, JSON.parse(JSON.stringify(jd)));

    const handleSubmitEditJD = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
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

    const handleCancelEditJD = (): void => {
        if (JSON.stringify(jd) === JSON.stringify(editJD) || window.confirm('Do you want to leave without saving the changes?')) {
            dispatchEditJD({ type: 'RESET_EDIT' });
            onCancel();
        }
    };

    return (
        <form className={cx('edit-jd-form')} onSubmit={handleSubmitEditJD}>
            <Row space={20}>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('form-group')}>
                        <label htmlFor="position" className={cx('form-group__label')}>
                            Position
                        </label>
                        <input
                            id="position"
                            type="text"
                            required
                            value={editJD.position}
                            onChange={(e) => dispatchEditJD({ type: 'POSITION', payload: e.target.value })}
                            className={cx('form-group__entry')}
                        />
                    </div>
                </Col>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('form-group')}>
                        <label htmlFor="level" className={cx('form-group__label')}>
                            Level
                        </label>
                        <input
                            id="level"
                            type="text"
                            required
                            value={editJD.level}
                            onChange={(e) => dispatchEditJD({ type: 'LEVEL', payload: e.target.value })}
                            className={cx('form-group__entry')}
                        />
                    </div>
                </Col>
            </Row>

            <Row space={20}>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('form-group')}>
                        <label htmlFor="location" className={cx('form-group__label')}>
                            Location
                        </label>
                        <input
                            id="location"
                            type="text"
                            required
                            value={editJD.location}
                            onChange={(e) => dispatchEditJD({ type: 'LOCATION', payload: e.target.value })}
                            className={cx('form-group__entry')}
                        />
                    </div>
                </Col>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('form-group')}>
                        <label htmlFor="expire-date" className={cx('form-group__label')}>
                            Expiration
                        </label>
                        <input
                            id="expire-date"
                            type="date"
                            required
                            // TODO: Use expire date instead
                            value={editJD.datetime}
                            onChange={(e) => dispatchEditJD({ type: 'DATE_TIME', payload: e.target.value })}
                            className={cx('form-group__entry')}
                        />
                    </div>
                </Col>
            </Row>

            <Row space={20}>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('form-group')}>
                        <label htmlFor="years-of-experience" className={cx('form-group__label')}>
                            Years of Experience
                        </label>
                        <input
                            id="years-of-experience"
                            type="number"
                            required
                            value={editJD.experience_required}
                            onChange={(e) => dispatchEditJD({ type: 'EXPERIENCE_REQUIRED', payload: Number(e.target.value) })}
                            min={0}
                            className={cx('form-group__entry')}
                        />
                    </div>
                </Col>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('form-group')}>
                        <label htmlFor="referal-code" className={cx('form-group__label')}>
                            Referal code
                        </label>
                        <input
                            id="referal-code"
                            type="text"
                            value={editJD.referral_code}
                            onChange={(e) => dispatchEditJD({ type: 'REFERRAL_CODE', payload: e.target.value })}
                            className={cx('form-group__entry')}
                        />
                    </div>
                </Col>
            </Row>

            <Row space={20}>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('form-group')}>
                        <label htmlFor="recruiter" className={cx('form-group__label')}>
                            Recruiter
                        </label>
                        <input
                            id="recruiter"
                            type="text"
                            required
                            value={editJD.recruiter}
                            onChange={(e) => dispatchEditJD({ type: 'RECRUITER', payload: e.target.value })}
                            className={cx('form-group__entry')}
                        />
                    </div>
                </Col>
                <Col size={{ md: 6, lg: 6, xl: 6 }}>
                    <div className={cx('form-group')}>
                        <label htmlFor="approved-manager" className={cx('form-group__label')}>
                            Approved Manager
                        </label>
                        <input
                            id="approved-manager"
                            type="text"
                            required
                            value={editJD.hiring_manager}
                            onChange={(e) => dispatchEditJD({ type: 'HIRING_MANAGER', payload: e.target.value })}
                            className={cx('form-group__entry')}
                        />
                    </div>
                </Col>
            </Row>

            <div className={cx('form-group')}>
                <label htmlFor="qualifications" className={cx('form-group__label')}>
                    Qualifications
                </label>
                <textarea
                    id="qualifications"
                    required
                    value={editJD.qualifications?.join('\n')}
                    onChange={(e) => dispatchEditJD({ type: 'QUALIFICATIONS', payload: e.target.value })}
                    className={cx('form-group__entry')}
                />
            </div>

            <div className={cx('form-group')}>
                <label htmlFor="job-description" className={cx('form-group__label')}>
                    Job Description
                </label>
                <textarea
                    id="job-description"
                    required
                    value={editJD.job_description}
                    onChange={(e) => dispatchEditJD({ type: 'JOB_DESCRIPTION', payload: e.target.value })}
                    className={cx('form-group__entry')}
                />
            </div>

            <div className={cx('form-group')}>
                <label htmlFor="responsibilities" className={cx('form-group__label')}>
                    Responsibilities
                </label>
                <textarea
                    id="responsibilities"
                    required
                    value={editJD.responsibilities?.join('\n')}
                    onChange={(e) => dispatchEditJD({ type: 'RESPONSIBILITIES', payload: e.target.value })}
                    className={cx('form-group__entry')}
                />
            </div>

            <div className={cx('form-group')}>
                <label htmlFor="skill-required" className={cx('form-group__label')}>
                    Required Skills
                </label>
                <textarea
                    id="skill-required"
                    required
                    value={editJD.skills_required?.join('\n')}
                    onChange={(e) => dispatchEditJD({ type: 'SKILLS_REQUIRED', payload: e.target.value })}
                    className={cx('form-group__entry')}
                />
            </div>

            <div className={cx('form-group')}>
                <label htmlFor="about-company" className={cx('form-group__label')}>
                    About Company
                </label>
                <textarea
                    id="about-company"
                    value={editJD.company_description}
                    onChange={(e) => dispatchEditJD({ type: 'COMPANY_DESCRIPTION', payload: e.target.value })}
                    className={cx('form-group__entry')}
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
