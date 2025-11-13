import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminJDList.module.scss';
import frameStyles from '../../assets/styles/admins/adminFrame.module.scss';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { compareDateWithToday } from '../../shared/helpers/commonUntils';
import { deleteJD, getJDByPosition, getJDPreviewUrl, updateJD } from '../../shared/apis/jdApis';
import type { JD } from '../../shared/types/adminTypes';
import { Button, Col, ReviewModal, Row } from '../layouts';
import { toast } from 'react-toastify';

const cx = classNames.bind({ ...frameStyles, ...styles });

interface Filter {
    jd_title: string;
}

type FilterAction = { type: 'JD_TITLE'; payload: string };

const initFilterValue: Filter = {
    jd_title: '',
};

const filterReducer = (state: Filter, action: FilterAction): Filter => {
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

const AdminJDList = () => {
    const [jds, setJds] = useState<JD[]>([]);
    const [editJD, dispatchEditJD] = useReducer(editJDReducer, initEditJDValue);
    const [previewJD, setPreviewJD] = useState<JD | null>(null);
    const [filter, dispatchFilter] = useReducer(filterReducer, initFilterValue);

    const fetchJDs = useCallback(async (position: string = '') => {
        try {
            const data = await getJDByPosition(position);
            setJds(data || []);
        } catch (error) {
            console.error('Failed to fetch job descriptions:', error);
        }
    }, []);

    useEffect(() => {
        fetchJDs();
    }, [fetchJDs]);

    const filteredJDs = useMemo<typeof jds>(() => {
        const filterJDs = jds.filter((jd) => jd.position.toLowerCase().includes(filter.jd_title.toLowerCase()));
        return filterJDs;
    }, [filter.jd_title, jds]);

    const handleSubmitEditJD = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (editJD) {
            const jd = jds.find((jd) => jd.id === editJD.id);
            if (JSON.stringify(jd) === JSON.stringify(editJD)) {
                toast.warning('No changes detected!', {
                    position: 'top-center',
                    hideProgressBar: true,
                });
            } else {
                await updateJD(editJD);
                fetchJDs();
                dispatchEditJD({ type: 'RESET_EDIT' });
                toast.success('Saved', {
                    position: 'top-center',
                    hideProgressBar: true,
                });
            }
        }
    };

    const handleCancelEditJD = () => {
        const jd = jds.find((jd) => jd.id === editJD.id);
        if (
            JSON.stringify(jd) === JSON.stringify(editJD) ||
            (JSON.stringify(jd) !== JSON.stringify(editJD) && window.confirm('Do you want to leave without saving the changes?'))
        ) {
            dispatchEditJD({ type: 'RESET_EDIT' });
        }
    };

    const handleDeleteJD = async (jd: JD) => {
        if (window.confirm('Are you sure you want to delete this JD?')) {
            await deleteJD(jd.id);
            fetchJDs();
        }
    };

    return (
        <>
            <div className={cx('admin-frame')}>
                <div className={cx('admin-frame-header')}>
                    <h2 className={cx('admin-frame-header__title')}>Job Descriptions</h2>
                    <p className={cx('admin-frame-header__subtitle')}>Manage all job descriptions (JD) from the system.</p>
                </div>

                <Row space={10} className={cx('admin-frame-filter')}>
                    <Col size={{ sm: 5, md: 3, lg: 3, xl: 3 }}>
                        <input
                            id="jd-position"
                            type="text"
                            placeholder="Search by JD position"
                            className={cx('admin-frame-filter__entry')}
                            onChange={(e) => dispatchFilter({ type: 'JD_TITLE', payload: e.target.value })}
                        />
                    </Col>
                </Row>

                {filteredJDs.map((jd) => (
                    <details key={jd.id} className={cx('jd')}>
                        <div className={cx('jd__action')}>
                            <Button type="edit" onClick={() => dispatchEditJD({ type: 'SET_EDIT_JD', payload: jd })} />
                            <Button type="download" onClick={() => setPreviewJD(jd)} />
                            <Button type="delete" onClick={() => handleDeleteJD(jd)} />
                        </div>

                        <summary className={cx('jd__title')}>
                            <i className={cx('jd__title-label')}>
                                {/* TODO: Use jd.expire_datetime instead of jd.datetime */}
                                <strong>{jd.position}</strong> - Status:
                                {compareDateWithToday(jd.datetime) ? (
                                    <span className={cx('jd__title-label-status-closed')}> Closed</span>
                                ) : (
                                    <span className={cx('jd__title-label-status-opening')}> Opening</span>
                                )}
                            </i>
                        </summary>

                        {editJD.id === jd.id ? (
                            <form className={cx('edit-jd-form')} onSubmit={handleSubmitEditJD}>
                                <Row space={20}>
                                    <Col size={{ md: 6, lg: 6, xl: 6 }}>
                                        <div className={cx('edit-jd-form__group')}>
                                            <label htmlFor="position-title" className={cx('edit-jd-form__group-label')}>
                                                Position title
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
                                                Position level
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
                                            <label htmlFor="expire-date" className={cx('edit-jd-form__group-label')}>
                                                Expire date
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
                                    <Col size={{ md: 6, lg: 6, xl: 6 }}>
                                        <div className={cx('edit-jd-form__group')}>
                                            <label htmlFor="experience-required" className={cx('edit-jd-form__group-label')}>
                                                Experience required
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
                                                Hiring manager
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
                                    <label htmlFor="work-location" className={cx('edit-jd-form__group-label')}>
                                        Work location
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

                                <div className={cx('edit-jd-form__group')}>
                                    <label htmlFor="qualifications" className={cx('edit-jd-form__group-label')}>
                                        Qualifications
                                    </label>
                                    <textarea
                                        id="qualifications"
                                        required
                                        value={editJD.qualifications.join('\n')}
                                        onChange={(e) => dispatchEditJD({ type: 'QUALIFICATIONS', payload: e.target.value })}
                                        className={cx('edit-jd-form__group-entry')}
                                    />
                                </div>

                                <div className={cx('edit-jd-form__group')}>
                                    <label htmlFor="job-description" className={cx('edit-jd-form__group-label')}>
                                        Job description
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
                                        Skill required
                                    </label>
                                    <textarea
                                        id="skill-required"
                                        required
                                        value={editJD.skills_required.join('\n')}
                                        onChange={(e) => dispatchEditJD({ type: 'SKILLS_REQUIRED', payload: e.target.value })}
                                        className={cx('edit-jd-form__group-entry')}
                                    />
                                </div>

                                <div className={cx('edit-jd-form__group')}>
                                    <label htmlFor="about-company" className={cx('edit-jd-form__group-label')}>
                                        About company
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
                        ) : (
                            <Row>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Expire date:</span> {jd.datetime}
                                </Col>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Position:</span> {jd.position}
                                </Col>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Level:</span> {jd.level}
                                </Col>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Experience Required:</span> {jd.experience_required} years
                                </Col>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Location:</span> {jd.location}
                                </Col>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Qualifications:</span>{' '}
                                    {jd.qualifications.map((qualification, index) => (
                                        <span key={index}>{qualification}. </span>
                                    ))}
                                </Col>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Referal Code:</span> {jd.referral_code || 'None'}
                                </Col>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Recruiter:</span> {jd.recruiter}
                                </Col>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Line manager:</span> {jd.hiring_manager}
                                </Col>
                                <Col className={cx('jd__require')}>
                                    <span className={cx('jd__require-title')}>Description:</span>
                                    <p className={cx('jd__require-frame')}>{jd.job_description}</p>
                                </Col>
                                <Col className={cx('jd__require')}>
                                    <span className={cx('jd__require-title')}>Skill requirements:</span>
                                    <ul className={cx('jd__require-frame')}>
                                        {jd.skills_required.map((skill, index) => (
                                            <li key={index} className={cx('jd__require-frame-item')}>
                                                {skill}
                                            </li>
                                        ))}
                                    </ul>
                                </Col>
                                <Col className={cx('jd__require')}>
                                    <span className={cx('jd__require-title')}>Responsibilities:</span>
                                    <ul className={cx('jd__require-frame')}>
                                        {jd.responsibilities.map((res, index) => (
                                            <li key={index} className={cx('jd__require-frame-item')}>
                                                {res}
                                            </li>
                                        ))}
                                    </ul>
                                </Col>
                                {jd.company_description && (
                                    <Col className={cx('jd__require')}>
                                        <span className={cx('jd__require-title')}>About our company:</span>
                                        <p className={cx('jd__require-frame')}>{jd.company_description}</p>
                                    </Col>
                                )}
                            </Row>
                        )}
                    </details>
                ))}
            </div>

            <ReviewModal open={!!previewJD} title={previewJD?.position || 'JD Preview'} onClose={() => setPreviewJD(null)}>
                {previewJD && (
                    <div className={cx('show-cv-modal-iframe-container')} style={{ marginTop: '1rem' }}>
                        <iframe src={getJDPreviewUrl(previewJD.id)} title="CV Preview" width="100%" height="600px" style={{ border: '1px solid #ccc' }} />
                    </div>
                )}
            </ReviewModal>
        </>
    );
};

export default AdminJDList;
