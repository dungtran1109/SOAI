import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminJDList.module.scss';
import frameStyles from '../../assets/styles/admins/adminFrame.module.scss';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { compareDateWithToday } from '../../shared/helpers/commonUntils';
import { deleteJD, getJDByPosition, getJDPreviewUrl, updateJD } from '../../shared/apis/jdApis';
import type { JD } from '../../shared/types/adminTypes';
import { Button, Col, ReviewModal, Row } from '../layouts';
import { toast } from 'react-toastify';
import AdminJDForm from './AdminJDForm';

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

const AdminJDList = () => {
    const [jds, setJds] = useState<JD[]>([]);
    const [editJD, setEditCV] = useState<JD | null>(null);
    const [previewJD, setPreviewJD] = useState<JD | null>(null);
    const [filter, dispatchFilter] = useReducer(filterReducer, initFilterValue);

    const fetchJDs = useCallback(async (position: string = ''): Promise<void> => {
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

    const handleEditJD = async (updatedJD: JD): Promise<void> => {
        if (updatedJD && Object.keys(updatedJD).length > 0) {
            await updateJD(updatedJD);
            fetchJDs();
            setEditCV(null);
            toast.success('Saved', {
                position: 'top-center',
                hideProgressBar: true,
            });
        }
    };

    const handleDeleteJD = async (jd: JD): Promise<void> => {
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
                            <Button type="edit" onClick={() => setEditCV(jd)} />
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

                        {editJD?.id === jd.id ? (
                            <AdminJDForm jd={editJD} onSubmit={handleEditJD} onCancel={() => setEditCV(null)} />
                        ) : (
                            <Row>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Expiration:</span> {jd.datetime}
                                </Col>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Position:</span> {jd.position}
                                </Col>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Level:</span> {jd.level}
                                </Col>
                                <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                                    <span className={cx('jd__require-title')}>Years of Experience:</span> {jd.experience_required} years
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
                                    <span className={cx('jd__require-title')}>Approved Manager:</span> {jd.hiring_manager}
                                </Col>
                                <Col className={cx('jd__require')}>
                                    <span className={cx('jd__require-title')}>Job Description</span>
                                    <p className={cx('jd__require-frame')}>{jd.job_description}</p>
                                </Col>
                                <Col className={cx('jd__require')}>
                                    <span className={cx('jd__require-title')}>Required Skills</span>
                                    <ul className={cx('jd__require-frame')}>
                                        {jd.skills_required.map((skill, index) => (
                                            <li key={index} className={cx('jd__require-frame-item')}>
                                                {skill}
                                            </li>
                                        ))}
                                    </ul>
                                </Col>
                                <Col className={cx('jd__require')}>
                                    <span className={cx('jd__require-title')}>Responsibilities</span>
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
                                        <span className={cx('jd__require-title')}>About Company</span>
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
