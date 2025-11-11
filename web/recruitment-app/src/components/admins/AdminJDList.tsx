import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminJDList.module.scss';
import frameStyles from '../../assets/styles/admins/adminFrame.module.scss';
import { useCallback, useEffect, useState } from 'react';
import { getJDByPosition } from '../../shared/apis/jdApis';
import type { JD } from '../../shared/types/adminTypes';
import { Col, Row } from '../layouts';
import { FiDownload, FiTrash2 } from 'react-icons/fi';
import { FaPen } from 'react-icons/fa';

const cx = classNames.bind({ ...frameStyles, ...styles });

const AdminJDList = () => {
    const [jds, setJds] = useState<JD[]>([]);

    const fetchJDs = useCallback(async (position: string = '') => {
        try {
            const data = await getJDByPosition(position);
            setJds(data || []);
        } catch (error) {
            console.error('Failed to fetch job description:', error);
        }
    }, []);

    useEffect(() => {
        fetchJDs();
    }, [fetchJDs]);

    console.log(jds);

    return (
        <div className={cx('admin-frame')}>
            <div className={cx('admin-frame-header')}>
                <h2 className={cx('admin-frame-header__title')}>Job Descriptions</h2>
                <p className={cx('admin-frame-header__subtitle')}>Manage all job descriptions (JD) from the system.</p>
            </div>

            {jds.map((jd) => (
                <details key={jd.id} className={cx('jd')}>
                    <summary className={cx('jd__title')}>
                        <i className={cx('jd__title-label')}>
                            <strong>{jd.position}</strong> - Created: {jd.datetime}
                        </i>
                        <div className={cx('jd__title-action')}>
                            <button className={cx('jd__title-action-btn', 'jd__title-action-btn--edit')}>
                                <FaPen size={15} />
                            </button>
                            <button className={cx('jd__title-action-btn', 'jd__title-action-btn--delete')}>
                                <FiTrash2 size={18} />
                            </button>
                            <button className={cx('jd__title-action-btn', 'jd__title-action-btn--download')}>
                                <FiDownload size={18} />
                            </button>
                        </div>
                    </summary>
                    <Row>
                        <Col className={cx('jd__require')} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 4 }}>
                            <span className={cx('jd__require-title')}>Job ID:</span> {jd.id}
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
                                <span key={index}>{qualification}</span>
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
                </details>
            ))}
        </div>
    );
};

export default AdminJDList;
