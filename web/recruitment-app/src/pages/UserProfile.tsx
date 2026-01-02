import { Col, Container, Row } from '../components/layouts';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { FiActivity, FiBarChart } from 'react-icons/fi';
import { getUserAppliedJobs } from '../services/api/cvApi';
import { uploadProofImages } from '../services/api/proofApi';
import { initJDFilterValue, jdFilterReducer } from '../services/reducer/filterReducer/jdFilter';
import { initCVFilterValue, cvFilterReducer } from '../services/reducer/filterReducer/cvFilter';
import { STATUS } from '../shared/types/adminTypes';
import type { AppliedJob } from '../shared/types/userTypes';
import classNames from 'classnames/bind';
import styles from '../assets/styles/users/userProfile.module.scss';
import UserAvatar from '../assets/images/user-default.png';
import UserAppliedJobCard from '../components/users/UserProfileJobCard';
import UserFooter from '../components/users/UserFooter';
import { toast } from 'react-toastify';

const cx = classNames.bind(styles);

const UserProfile = () => {
    const [jobs, setJobs] = useState<AppliedJob[]>([]);
    const [jdFilter, dispatchJDFilter] = useReducer(jdFilterReducer, initJDFilterValue);
    const [cvFilter, dispatchCVFilter] = useReducer(cvFilterReducer, initCVFilterValue);

    useEffect(() => {
        const getAppliedJobs = async () => {
            const results = await getUserAppliedJobs();
            setJobs(results);
        };

        getAppliedJobs();
    }, []);

    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => job.position.toLowerCase().includes(jdFilter.title.toLowerCase()) && cvFilter.status.includes(job.status));
    }, [jdFilter.title, cvFilter.status, jobs]);

    const handleUploadProofImages = useCallback(async (files: FileList, cvId: number) => {
        try {
            await uploadProofImages(files, cvId);
            toast.success(`Succeed to upload proof images`, {
                position: 'top-center',
                hideProgressBar: true,
            });
            // TODO: Display proof images
            // const updated = await getProofImages(cvId);
            // setProofImages((prev) => ({ ...prev, [cvId]: updated }));
        } catch (error) {
            console.error('Failed to upload proof images:', error);
            toast.warning(`Failed to upload proof images: ${(error as Error).message}`, {
                position: 'top-center',
                hideProgressBar: true,
            });
        }
    }, []);

    return (
        <>
            <Container className={cx('profile')}>
                <div className={cx('user')}>
                    <div className={cx('user__avatar')}>
                        <img src={UserAvatar} alt="User" width={120} height={120} />
                    </div>
                    <strong className={cx('user__name')}>{jobs.length !== 0 ? jobs[0].username : 'Unknown User'}</strong>
                </div>

                <div className={cx('navbar')}>
                    <ul className={cx('navbar__left')}>
                        {/* TODO: Scroll to the part that has the same ID when click on */}
                        <li className={cx('navbar__left-item')}>My Application</li>
                        <li className={cx('navbar__left-item')}>About</li>
                    </ul>
                    <section className={cx('navbar__right')}>
                        <FaBell className={cx('navbar__right-icon')} />
                        <span>{filteredJobs.length} candidates</span>
                    </section>
                </div>

                <hr style={{ margin: '10px' }} />

                <Row space={10} className={cx('content')}>
                    <Col size={{ xs: 0, sm: 0, md: 0, lg: 4, xl: 3 }} className={cx('filter')}>
                        <div className={cx('filter__title')}>
                            <FiBarChart size={18} />
                            <h2 className={cx('filter__title-label')}>Applied Jobs</h2>
                        </div>

                        <ul className={cx('filter__jobs')}>
                            <li
                                className={cx('filter__jobs-title', { 'filter__jobs-title--selected': !jdFilter.title })}
                                onClick={() => dispatchJDFilter({ type: 'JD_TITLE', payload: '' })}
                            >
                                All Jobs
                            </li>
                            {jobs.map((job) => (
                                <li
                                    key={job.id}
                                    className={cx('filter__jobs-title', { 'filter__jobs-title--selected': jdFilter.title === job.position })}
                                    onClick={() => dispatchJDFilter({ type: 'JD_TITLE', payload: job.position })}
                                >
                                    {job.position}
                                </li>
                            ))}
                        </ul>

                        <div className={cx('filter__title')}>
                            <FiActivity size={18} />
                            <h2 className={cx('filter__title-label')}>Status</h2>
                        </div>

                        <div className={cx('filter__jobs')}>
                            {STATUS.map((status) => (
                                <label key={status} htmlFor={status} className={cx('filter__jobs-status')}>
                                    <input
                                        type="checkbox"
                                        name={status}
                                        id={status}
                                        checked={cvFilter.status.includes(status)}
                                        onChange={() => dispatchCVFilter({ type: 'STATUS', payload: status })}
                                    />
                                    <span className={cx('filter__jobs-status-title')}>{status}</span>
                                </label>
                            ))}
                        </div>
                    </Col>

                    <Col size={{ xs: 12, sm: 12, md: 12, lg: 8, xl: 9 }} className={cx('job-cards')}>
                        {filteredJobs.length === 0 ? (
                            <p className={cx('job-cards__no-data')}>Oops! No jobs right now 👀</p>
                        ) : (
                            filteredJobs.map((job) => <UserAppliedJobCard key={job.id} job={job} onUploadProof={handleUploadProofImages} />)
                        )}
                    </Col>
                </Row>
            </Container>

            <UserFooter />
        </>
    );
};

export default UserProfile;
