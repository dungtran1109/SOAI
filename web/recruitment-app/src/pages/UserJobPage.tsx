import classNames from 'classnames/bind';
import styles from '../assets/styles/users/userJobPage.module.scss';
import { Col, Container, Row } from '../components/layouts';
import UserJobCard from '../components/users/UserJobCard';
import { useEffect, useState } from 'react';
import { getJDs } from '../services/api/jdApi';
import type { JD } from '../shared/types/adminTypes';
import logo from '../assets/images/logo.png';
import { FiActivity, FiClock, FiDollarSign, FiMapPin } from 'react-icons/fi';

const cx = classNames.bind(styles);

const UserJobPage = () => {
    const [jds, setJds] = useState<JD[]>([]);
    const [viewJob, setViewJob] = useState<JD | null>(null);

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

    const handleSubmitFilter = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        console.log('Submitted');
    };

    console.log(viewJob);

    return (
        <>
            <div className={cx('filter')}>
                <Container>
                    <form onSubmit={handleSubmitFilter} className={cx('filter-form')}>
                        <Row space={10}>
                            <Col size={{ xs: 12, sm: 12, md: 3, lg: 2, xl: 2 }}>
                                <select className={cx('filter-form__item')}>
                                    <option className={cx('filter__select-option')}>Ho Chi Minh</option>
                                </select>
                            </Col>
                            <Col size={{ xs: 12, sm: 12, md: 9, xl: 10, lg: 10 }}>
                                <input className={cx('filter-form__item')} placeholder="Entry any thing..." />
                            </Col>
                        </Row>
                    </form>
                </Container>
            </div>

            <Container>
                <p className={cx('job_counter')}>
                    <span>{jds.length} jobs</span> are opening 👇
                </p>

                <Row>
                    <Col size={{ xs: 12, sm: 12, md: 12, lg: 5, xl: 5 }} className={cx('job-left')}>
                        {jds.map((jd) => (
                            <UserJobCard key={jd.id} job={jd} onClick={() => setViewJob(jd)} highlight={viewJob?.id === jd.id} />
                        ))}
                        {jds.map((jd) => (
                            <UserJobCard key={jd.id} job={jd} onClick={() => setViewJob(jd)} highlight={viewJob?.id === jd.id} />
                        ))}
                    </Col>
                    {viewJob && (
                        <Col size={{ xs: 12, sm: 12, md: 12, lg: 7, xl: 7 }} className={cx('job-right')}>
                            <div className={cx('job')}>
                                <div className={cx('job__header')}>
                                    <div className={cx('job__header-left')}>
                                        <img src={logo} alt="Logo" className={cx('job__header-left-img')} />
                                    </div>
                                    <div className={cx('job__header-right')}>
                                        <h1>{viewJob.position}</h1>
                                        <p className={cx('job__header-right-header')}>WarmHouse Company Limited</p>
                                        <p className={cx('job__header-right-salary')}>
                                            <FiDollarSign />
                                            <span>You'll love it</span>
                                        </p>
                                    </div>
                                </div>

                                <button className={cx('job__submit-btn')}>Apply</button>

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
                                                <li className={cx('job__content-detail')}>{responsibility}</li>
                                            ))}
                                        </ul>
                                    </section>

                                    <section className={cx('job__content-section')}>
                                        <h2 className={cx('job__content-title')}>Your skills and experiences</h2>
                                        <ul>
                                            {viewJob.skills_required.map((skill) => (
                                                <li className={cx('job__content-detail')}>{skill}</li>
                                            ))}
                                        </ul>
                                    </section>
                                </div>

                                <hr style={{ margin: '10px 0' }} />

                                <Row space={10}>
                                    <Col size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }} className={cx('job__footer-section')}>
                                        <FiActivity />
                                        <span>Referral Code: {viewJob.referral_code}</span>
                                    </Col>
                                    <Col size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }} className={cx('job__footer-section')}>
                                        <FiClock />
                                        <span>Posted Date: {new Date(viewJob.datetime).toLocaleString()}</span>
                                    </Col>
                                    <Col size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }} className={cx('job__footer-section')}>
                                        <FiMapPin />
                                        <span>{viewJob.location}</span>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                    )}
                </Row>
            </Container>
        </>
    );
};

export default UserJobPage;
