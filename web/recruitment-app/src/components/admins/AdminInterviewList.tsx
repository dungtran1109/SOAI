import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { getApprovedCVs, getInterviews, scheduleInterview } from '../../services/api/interviewApis';
import { Col, ReviewModal, Row } from '../layouts';
import type { CV, Interview, ScheduleInterview } from '../../shared/types/adminTypes';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminInterviewList.module.scss';
import frameStyles from '../../assets/styles/admins/adminFrame.module.scss';
import { toast } from 'react-toastify';

const cx = classNames.bind({ ...frameStyles, ...styles });

interface Filter {
    candidateName: string;
}

const initFilterValue: Filter = {
    candidateName: '',
};

type FilterAction = { type: 'CANDIDATE_NAME'; payload: string };

const filterReducer = (state: Filter, action: FilterAction): Filter => {
    switch (action.type) {
        case 'CANDIDATE_NAME':
            return { ...state, candidateName: action.payload };
        default:
            return state;
    }
};

interface ScheduleInterviewForm {
    formData: ScheduleInterview;
    formConfirm: boolean;
}

const AdminInterviewList = () => {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [approvedCVs, setApprovedCVs] = useState<CV[]>([]);
    const [filter, dispatchFilter] = useReducer(filterReducer, initFilterValue);

    const [schedule, setSchedule] = useState<ScheduleInterviewForm | null>(null);
    const [session, setSession] = useState<Interview | null>(null);

    const fetchApprovedCVsAndInterviews = useCallback(() => {
        const fetchApprovedCVs = async () => {
            try {
                const result = await getApprovedCVs();
                setApprovedCVs(result);
            } catch (error) {
                console.error('Failed to fetch approved CVs:', error);
            }
        };

        const fetchInterviews = async () => {
            try {
                const result = await getInterviews();
                setInterviews(result);
            } catch (error) {
                console.error('Failed to fetch interview session:', error);
            }
        };

        fetchApprovedCVs();
        fetchInterviews();
    }, []);

    useEffect(() => {
        fetchApprovedCVsAndInterviews();
    }, [fetchApprovedCVsAndInterviews]);

    const filteredInterviews = useMemo<typeof interviews>(() => {
        const filteredInterviews = interviews.filter((interview) => interview.candidate_name.toLowerCase().includes(filter.candidateName.toLowerCase()));
        return filteredInterviews;
    }, [filter.candidateName, interviews]);

    const filteredApprovedCVs = useMemo<typeof approvedCVs>(() => {
        const scheduledCVs = filteredInterviews.map((cv) => cv.id);
        const filteredApprovedCVs = approvedCVs.filter(
            (cv) => cv.candidate_name.toLowerCase().includes(filter.candidateName.toLowerCase()) && !scheduledCVs.includes(cv.id),
        );
        return filteredApprovedCVs;
    }, [approvedCVs, filter.candidateName, filteredInterviews]);

    const openScheduleModal = (cv: CV) => {
        setSchedule({
            formData: { ...cv, interviewer_name: '', interview_datetime: '', interview_location: '' },
            formConfirm: false,
        });
    };

    const closeScheduleModal = useCallback((): void => {
        if (schedule) {
            if (schedule.formData.interviewer_name || schedule.formData.interview_datetime || schedule.formData.interview_location) {
                if (window.confirm('You have unsaved changes. Are you sure you want to leave without saving?')) {
                    setSchedule(null);
                }
            } else {
                setSchedule(null);
            }
        }
    }, [schedule]);

    const handleScheduleInterview = useCallback(
        async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
            e.preventDefault();
            if (schedule) {
                const response = await scheduleInterview(schedule.formData);
                fetchApprovedCVsAndInterviews();
                setSchedule(null);
                toast.success(response.message, {
                    position: 'top-center',
                    hideProgressBar: true,
                });
            }
        },
        [fetchApprovedCVsAndInterviews, schedule],
    );

    console.log(session);

    return (
        <>
            <div className={cx('admin-frame')}>
                <div className={cx('admin-frame-header')}>
                    <h2 className={cx('admin-frame-header__title')}>Interview Management</h2>
                    <p className={cx('admin-frame-header__subtitle')}>Setup interview sessions with approved CVs by the system.</p>
                </div>

                <Row space={10} className={cx('admin-frame-filter')}>
                    <Col size={{ sm: 5, md: 3, lg: 3, xl: 3 }}>
                        <input
                            id="candidate-name"
                            type="text"
                            placeholder="Search by candidate name"
                            className={cx('admin-frame-filter__entry')}
                            onChange={(e) => dispatchFilter({ type: 'CANDIDATE_NAME', payload: e.target.value })}
                        />
                    </Col>
                </Row>

                <Row space={20} className={cx('interview')}>
                    <Col size={{ md: 4, lg: 4, xl: 4 }} className={cx('interview-col')}>
                        <h3 className={cx('interview-col__title', 'interview-col__title--pending')}>Scheduling Interviews</h3>

                        <section className={cx('interview-col__section')}>
                            {filteredApprovedCVs.map((cv) => (
                                <div key={cv.id} className={cx('interview-col__card')} onClick={() => openScheduleModal(cv)}>
                                    <h3>{cv.candidate_name.toUpperCase()}</h3>

                                    <div className={cx('interview-col__card-content')}>
                                        <p className={cx('interview-col__card-content-item')}>
                                            <strong>Position:</strong> {cv.position}
                                        </p>
                                        <p className={cx('interview-col__card-content-item')}>
                                            <strong>Score:</strong> {cv.matched_score}
                                        </p>
                                        <p className={cx('interview-col__card-content-item')}>
                                            <strong>Email:</strong> {cv.email}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </section>
                    </Col>

                    <Col size={{ md: 4, lg: 4, xl: 4 }} className={cx('interview-col')}>
                        <h3 className={cx('interview-col__title', 'interview-col__title--accepted')}>Upcoming Interviews</h3>

                        <section className={cx('interview-col__section')}>
                            {filteredInterviews.map(
                                (interview) =>
                                    interview.status === 'Pending' && (
                                        <div key={interview.id} className={cx('interview-col__card')} onClick={() => setSession(interview)}>
                                            <h3>{interview.candidate_name.toUpperCase()}</h3>

                                            <div className={cx('interview-col__card-content')}>
                                                <p className={cx('interview-col__card-content-item')}>
                                                    <strong>Position:</strong> React Web Developer (Frontend)
                                                </p>
                                                <p className={cx('interview-col__card-content-item')}>
                                                    <strong>Interviewer:</strong> {interview.interviewer_name}
                                                </p>
                                                <p className={cx('interview-col__card-content-item')}>
                                                    <strong>Venue:</strong> Online - MS Teams
                                                </p>
                                                <p className={cx('interview-col__card-content-item')}>
                                                    <strong>Time:</strong> {new Date(interview.interview_datetime).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ),
                            )}
                        </section>
                    </Col>

                    <Col size={{ md: 4, lg: 4, xl: 4 }} className={cx('interview-col')}>
                        <h3 className={cx('interview-col__title', 'interview-col__title--result')}>Result of Interviews</h3>
                    </Col>
                </Row>

                <ReviewModal title={`Schedule Interview for ${schedule?.formData.candidate_name}`} open={!!schedule} onClose={closeScheduleModal} width={700}>
                    {schedule && (
                        <>
                            <div className={cx('scheduling-cv')}>
                                <p className={cx('scheduling-cv__personal-data')}>
                                    <strong>Name:</strong> {schedule.formData.candidate_name}
                                </p>
                                <p className={cx('scheduling-cv__personal-data')}>
                                    <strong>Email:</strong> {schedule.formData.email}
                                </p>
                                <p className={cx('scheduling-cv__personal-data')}>
                                    <strong>Position:</strong> {schedule.formData.position}
                                </p>
                                <p className={cx('scheduling-cv__personal-data')}>
                                    <strong>Score:</strong> {schedule.formData.matched_score}
                                </p>
                            </div>
                            <hr style={{ margin: '20px 0 30px' }} />
                            <form className={cx('scheduling-form')} onSubmit={handleScheduleInterview}>
                                <Row space={10} className={cx('scheduling-form__group')}>
                                    <Col size={{ md: 6, lg: 7, xl: 6 }}>
                                        <input
                                            type="email"
                                            value={schedule.formData.interviewer_name}
                                            onChange={(e) =>
                                                setSchedule({
                                                    ...schedule,
                                                    formData: {
                                                        ...schedule.formData,
                                                        interviewer_name: e.target.value,
                                                    },
                                                })
                                            }
                                            className={cx('scheduling-form__group-entry')}
                                            placeholder="Email of Interviewer"
                                            required
                                        />
                                    </Col>

                                    <Col size={{ md: 6, lg: 5, xl: 6 }}>
                                        <input
                                            type="datetime-local"
                                            value={schedule.formData.interview_datetime}
                                            onChange={(e) =>
                                                setSchedule({
                                                    ...schedule,
                                                    formData: {
                                                        ...schedule.formData,
                                                        interview_datetime: e.target.value,
                                                    },
                                                })
                                            }
                                            className={cx('scheduling-form__group-entry')}
                                            placeholder="Datetime"
                                            required
                                        />
                                    </Col>
                                </Row>

                                <div className={cx('scheduling-form__group')}>
                                    <input
                                        type="text"
                                        value={schedule.formData.interview_location}
                                        onChange={(e) =>
                                            setSchedule({
                                                ...schedule,
                                                formData: {
                                                    ...schedule.formData,
                                                    interview_location: e.target.value,
                                                },
                                            })
                                        }
                                        className={cx('scheduling-form__group-entry')}
                                        placeholder="Location"
                                        required
                                    />
                                </div>

                                <label className={cx('scheduling-form__confirm')}>
                                    <input type="checkbox" onChange={(e) => setSchedule({ ...schedule, formConfirm: e.target.checked })} />I agree so that
                                    sending an email to the candidate and interviewer based on the information.
                                </label>

                                <button
                                    disabled={!schedule.formConfirm}
                                    className={cx('scheduling-form__submit-btn', {
                                        'scheduling-form__submit-btn--disable': !schedule.formConfirm,
                                    })}
                                    type="submit"
                                >
                                    Send
                                </button>
                            </form>
                        </>
                    )}
                </ReviewModal>
            </div>
        </>
    );
};

export default AdminInterviewList;
