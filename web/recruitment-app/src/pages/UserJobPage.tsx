import { Col, Container, Row } from '../components/layouts';
import { FiActivity, FiClock, FiDollarSign, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { uploadCV } from '../services/api/cvApi';
import { initJDFilterValue, jdFilterReducer } from '../services/reducer/filterReducer/jdFilter';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { getJDs } from '../services/api/jdApi';
import type { JD } from '../shared/types/adminTypes';
import classNames from 'classnames/bind';
import styles from '../assets/styles/users/userJobPage.module.scss';
import logo from '../assets/images/logo.png';
import UserJobCard from '../components/users/UserJobCard';
import UserFooter from '../components/users/UserFooter';

const cx = classNames.bind(styles);

const UserJobPage = () => {
    const [jds, setJds] = useState<JD[]>([]);
    const [viewJob, setViewJob] = useState<JD | null>(null);
    const [filter, dispatchFilter] = useReducer(jdFilterReducer, initJDFilterValue);

    useEffect(() => {
        const fetchJobs = async (position: string = ''): Promise<void> => {
            try {
                const results = await getJDs(position);
                if (results.length > 0) {
                    setJds(results);
                    setViewJob(results[0]);
                }
            } catch (error) {
                console.error('Failed to fetch job descriptions:', error);
            }
        };

        fetchJobs();
    }, []);

    const filterJDs = useMemo(() => {
        return jds.filter(
            (jd) => jd.position.toLowerCase().includes(filter.title.toLowerCase()) && jd.location.toLowerCase().includes(filter.location.toLowerCase()),
        );
    }, [filter, jds]);

    const uniqueLocations = useMemo<string[]>(() => [...new Set(jds.map((jd) => jd.location).filter(Boolean))], [jds]);

    const handleSetViewJob = useCallback((jd: JD) => {
        setViewJob(jd);
    }, []);

    const handleUploadCVFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        // TODO: Check if user already auth or not
        const file = e.target.files?.[0];
        if (!file || !viewJob) return;
        try {
            const MAX_SIZE = 5 * 1024 * 1024; // Accept size 5 MB
            if (file.size > MAX_SIZE) {
                throw new Error('File size exceeds 5 MB limit.');
            }
            if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
                throw new Error('Invalid file type. Only PDF and Word documents are allowed.');
            }
            await uploadCV(file, viewJob.id);
            toast.success(`Succeed to apply CV to ${viewJob.position}`, {
                position: 'top-center',
                hideProgressBar: true,
            });
        } catch (error) {
            toast.warning(`Failed to upload CV: ${(error as Error).message}`, {
                position: 'top-center',
                hideProgressBar: true,
            });
        }
    };

    return (
        <>
            <div className={cx('filter')}>
                <Container>
                    <Row space={10}>
                        <Col size={{ xs: 12, sm: 12, md: 3, lg: 2, xl: 2 }}>
                            <select className={cx('filter__item')} onChange={(e) => dispatchFilter({ type: 'JD_LOCATION', payload: e.target.value })}>
                                <option className={cx('filter__select-option')}>-- All --</option>
                                {uniqueLocations.map((location) => (
                                    <option key={location} className={cx('filter__select-option')}>
                                        {location}
                                    </option>
                                ))}
                            </select>
                        </Col>
                        <Col size={{ xs: 12, sm: 12, md: 9, xl: 10, lg: 10 }}>
                            <input
                                value={filter.title}
                                onChange={(e) => dispatchFilter({ type: 'JD_TITLE', payload: e.target.value })}
                                className={cx('filter__item')}
                                placeholder="Entry a position title..."
                            />
                        </Col>
                    </Row>
                </Container>
            </div>

            <Container>
                <p className={cx('job_counter')}>
                    <span>{filterJDs.length} jobs</span> are opening 👇
                </p>

                <Row>
                    <Col size={{ xs: 12, sm: 12, md: 12, lg: 5, xl: 5 }} className={cx('job-left')}>
                        {filterJDs.map((jd) => (
                            <UserJobCard key={jd.id} job={jd} onClick={handleSetViewJob} highlight={viewJob?.id === jd.id} />
                        ))}
                    </Col>

                    {viewJob && (
                        <Col size={{ xs: 12, sm: 12, md: 12, lg: 7, xl: 7 }} className={cx('job-right')}>
                            <div className={cx('job')}>
                                <div className={cx('job-header')}>
                                    <div className={cx('job-header__left')}>
                                        <img src={logo} alt="Logo" className={cx('job-header__left-img')} />
                                    </div>
                                    <div className={cx('job-header__right')}>
                                        <h1>{viewJob.position}</h1>
                                        <p className={cx('job-header__right-header')}>WarmHouse Company Limited</p>
                                        <p className={cx('job-header__right-salary')}>
                                            <FiDollarSign />
                                            <span>You'll love it</span>
                                        </p>
                                    </div>
                                </div>

                                <div className={cx('job__submit')}>
                                    <input type="file" accept=".pdf,.doc,.docx" id="jd-upload-input" onChange={handleUploadCVFile} />
                                    <label htmlFor="jd-upload-input" className={cx('job__submit-btn')}>
                                        Apply
                                    </label>
                                </div>

                                <hr style={{ margin: '10px 0' }} />

                                <div className={cx('job__content')}>
                                    <section className={cx('job__content-section')}>
                                        <h2 className={cx('job__content-title')}>Job Description</h2>
                                        <p>{viewJob.job_description}</p>
                                    </section>

                                    <section className={cx('job__content-section')}>
                                        <h2 className={cx('job__content-title')}>Responsibilities</h2>
                                        <ul>
                                            {viewJob.responsibilities.map((responsibility) => (
                                                <li key={responsibility} className={cx('job__content-detail')}>
                                                    {responsibility}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>

                                    <section className={cx('job__content-section')}>
                                        <h2 className={cx('job__content-title')}>Your skills and experiences</h2>
                                        <ul>
                                            {viewJob.skills_required.map((skill) => (
                                                <li key={skill} className={cx('job__content-detail')}>
                                                    {skill}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                </div>

                                <hr style={{ margin: '10px 0' }} />

                                <Row space={10}>
                                    <Col size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }} className={cx('job__footer-section')}>
                                        <FiActivity />
                                        <p>Referral code: {viewJob.referral_code}</p>
                                    </Col>
                                    <Col size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }} className={cx('job__footer-section')}>
                                        <FiClock />
                                        <p>Posted date: {new Date(viewJob.datetime).toLocaleString()}</p>
                                    </Col>
                                    <Col size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }} className={cx('job__footer-section')}>
                                        <FiMapPin />
                                        <p>{viewJob.location}</p>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                    )}
                </Row>
            </Container>

            <UserFooter />
        </>
    );
};

export default UserJobPage;
