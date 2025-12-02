import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { toast } from 'react-toastify';
import { FiMoreVertical } from 'react-icons/fi';
import { FaCommentDots, FaPen, FaQuestionCircle, FaRegEdit } from 'react-icons/fa';
import { getApprovedCVs, getInterviews, scheduleInterview, generateInterviewQuestions, getAvailableInterviewQuestions } from '../../services/api/interviewApis';
import { Button, Col, ReviewModal, Row } from '../layouts';
import { STATUS } from '../../shared/types/adminTypes';
import type { CV, Interview, InterviewQuestion, InterviewSession, ScheduleInterview, Status } from '../../shared/types/adminTypes';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminInterviewList.module.scss';
import frameStyles from '../../assets/styles/admins/adminFrame.module.scss';
import dataEmpty from '../../assets/images/data-empty.png';
import Spinner from '../layouts/Spinner';

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

interface InterviewSessionForm {
    formData: InterviewSession;
    formConfirm: boolean;
}

interface Question {
    interviewSession: Interview;
    interviewQuestions?: InterviewQuestion[];
    loading: boolean;
}

const AdminInterviewList = () => {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [approvedCVs, setApprovedCVs] = useState<CV[]>([]);
    const [filter, dispatchFilter] = useReducer(filterReducer, initFilterValue);

    // States of Modals
    const [schedule, setSchedule] = useState<ScheduleInterviewForm | null>(null);
    const [session, setSession] = useState<InterviewSessionForm | null>(null);
    const [questions, setQuestions] = useState<Question | null>(null);

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

    const openSessionModal = (session: Interview) => {
        setSession({
            formData: { ...session, interview_comment: '' },
            formConfirm: false,
        });
    };

    const closeSessionModal = useCallback((): void => {
        if (session) {
            if (session.formData.interview_comment) {
                if (window.confirm('You have unsaved changes. Are you sure you want to leave without saving?')) {
                    setSession(null);
                }
            } else {
                setSession(null);
            }
        }
    }, [session]);

    const handleInterviewResult = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setSession(null);
        toast.success('[Testing] Updated interview session result successfully!', {
            position: 'top-center',
            hideProgressBar: true,
        });
    }, []);

    const openInterviewQuestionModal = async (interviewSession: Interview): Promise<void> => {
        setQuestions({ interviewQuestions: [], interviewSession: interviewSession, loading: true });
        let questions = await getAvailableInterviewQuestions(interviewSession.cv_application_id);
        if (questions.length === 0) {
            questions = await generateInterviewQuestions(interviewSession.cv_application_id);
        }
        setQuestions({ interviewQuestions: questions, interviewSession: interviewSession, loading: false });
    };

    const closeQuestionModal = () => {
        if (questions) {
            if (questions.loading) {
                toast.warning('Cannot close dialog while generating interview question.', {
                    position: 'top-center',
                    hideProgressBar: true,
                });
            } else {
                setQuestions(null);
            }
        }
    };

    const regenerateInterviewQuestions = async () => {
        if (questions?.interviewSession) {
            if (!questions.interviewQuestions || window.confirm('Do you want to regenerate questions?')) {
                setQuestions({ ...questions, loading: true });
                const response = await generateInterviewQuestions(questions.interviewSession.cv_application_id);
                setQuestions({ ...questions, interviewQuestions: response, loading: false });
                toast.success('Questions are generated successfully.');
            }
        }
    };

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
                            id="interview-list-candidate-name"
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
                                        <div key={interview.id} className={cx('interview-col__card')}>
                                            <div className={cx('interview-col__card-header')}>
                                                <h3>{interview.candidate_name.toUpperCase()}</h3>

                                                <section className={cx('card-header-popup')}>
                                                    <div className={cx('card-header-popup__icon')}>
                                                        <FiMoreVertical size={18} />
                                                    </div>

                                                    <div className={cx('card-header-popup__selection')}>
                                                        <p className={cx('card-header-popup__selection-option')}>
                                                            <FaPen
                                                                size={12}
                                                                className={cx(
                                                                    'card-header-popup__selection-option-icon',
                                                                    'card-header-popup__selection-option-icon--edit',
                                                                )}
                                                            />
                                                            Edit session
                                                        </p>
                                                        <p
                                                            className={cx('card-header-popup__selection-option')}
                                                            onClick={() => openInterviewQuestionModal(interview)}
                                                        >
                                                            <FaQuestionCircle
                                                                size={12}
                                                                className={cx(
                                                                    'card-header-popup__selection-option-icon',
                                                                    'card-header-popup__selection-option-icon--question',
                                                                )}
                                                            />
                                                            Sample questions
                                                        </p>
                                                        <p className={cx('card-header-popup__selection-option')} onClick={() => openSessionModal(interview)}>
                                                            <FaRegEdit
                                                                size={12}
                                                                className={cx(
                                                                    'card-header-popup__selection-option-icon',
                                                                    'card-header-popup__selection-option-icon--assessment',
                                                                )}
                                                            />
                                                            Assessment
                                                        </p>
                                                    </div>
                                                </section>
                                            </div>

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

                {/* Scheduling interview session for approved CVs - Scheduling Interviews column */}
                <ReviewModal title={`Schedule Interview for ${schedule?.formData.candidate_name}`} open={!!schedule} onClose={closeScheduleModal} width={700}>
                    {schedule && (
                        <>
                            <div className={cx('common-info')}>
                                <p className={cx('common-info__personal-data')}>
                                    <strong>Name:</strong> {schedule.formData.candidate_name}
                                </p>
                                <p className={cx('common-info__personal-data')}>
                                    <strong>Email:</strong> {schedule.formData.email}
                                </p>
                                <p className={cx('common-info__personal-data')}>
                                    <strong>Position:</strong> {schedule.formData.position}
                                </p>
                                <p className={cx('common-info__personal-data')}>
                                    <strong>Score:</strong> {schedule.formData.matched_score}
                                </p>
                            </div>
                            <hr style={{ margin: '20px 0 30px' }} />
                            <form onSubmit={handleScheduleInterview}>
                                <Row space={10} className={cx('form__group')}>
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
                                            className={cx('form__group-entry')}
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
                                            className={cx('form__group-entry')}
                                            placeholder="Datetime"
                                            required
                                        />
                                    </Col>
                                </Row>

                                <div className={cx('form__group')}>
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
                                        className={cx('form__group-entry')}
                                        placeholder="Location"
                                        required
                                    />
                                </div>

                                <label className={cx('form__confirm')}>
                                    <input type="checkbox" onChange={(e) => setSchedule({ ...schedule, formConfirm: e.target.checked })} />I agree so that
                                    sending an email to the candidate and interviewer based on the information.
                                </label>

                                <button
                                    disabled={!schedule.formConfirm}
                                    className={cx('form__submit-btn', {
                                        'form__submit-btn--disable': !schedule.formConfirm,
                                    })}
                                    type="submit"
                                >
                                    Send
                                </button>
                            </form>
                        </>
                    )}
                </ReviewModal>

                {/* Assess interview session - Upcoming Interviews column */}
                <ReviewModal title={`Interview Assessment for ${session?.formData.candidate_name}`} open={!!session} onClose={closeSessionModal} width={700}>
                    {session && (
                        <>
                            <div className={cx('common-info')}>
                                <p className={cx('common-info__personal-data')}>
                                    <strong>Name:</strong> {session.formData.candidate_name}
                                </p>
                                <p className={cx('common-info__personal-data')}>
                                    {/* TODO: Should show position instead of cv_application_id */}
                                    <strong>Position:</strong> {session.formData.cv_application_id}
                                </p>
                                <p className={cx('common-info__personal-data')}>
                                    <strong>Interviewer:</strong> {session.formData.interviewer_name}
                                </p>
                                <p className={cx('common-info__personal-data')}>
                                    <strong>Datetime:</strong> {new Date(session.formData.interview_datetime).toLocaleString()}
                                </p>
                            </div>
                            <hr style={{ margin: '20px 0 30px' }} />
                            <form onSubmit={handleInterviewResult}>
                                <div className={cx('form__group')}>
                                    <label htmlFor="result-of-interview" className={cx('form__group-label')}>
                                        Result of Interview
                                    </label>
                                    <select
                                        id="result-of-interview"
                                        className={cx('form__group-entry')}
                                        onChange={(e) =>
                                            setSession({
                                                ...session,
                                                formData: {
                                                    ...session.formData,
                                                    status: e.target.value as Status,
                                                },
                                            })
                                        }
                                    >
                                        {STATUS.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={cx('form__group')}>
                                    <label htmlFor="comment-of-interview" className={cx('form__group-label')}>
                                        Comment
                                    </label>
                                    <textarea id="comment-of-interview" className={cx('form__group-entry')} />
                                </div>

                                <label className={cx('form__confirm')}>
                                    <input type="checkbox" onChange={(e) => setSession({ ...session, formConfirm: e.target.checked })} />I agree so that notice
                                    this result to the candidate.
                                </label>

                                <button
                                    disabled={!session.formConfirm}
                                    className={cx('form__submit-btn', {
                                        'form__submit-btn--disable': !session.formConfirm,
                                    })}
                                    type="submit"
                                >
                                    Send
                                </button>
                            </form>
                        </>
                    )}
                </ReviewModal>

                {/* Interview questions - Upcoming Interviews column */}
                <ReviewModal title={`Available Questions`} open={!!questions} onClose={closeQuestionModal}>
                    {questions && (
                        <>
                            <div className={cx('common-info')}>
                                <p className={cx('common-info__personal-data')}>
                                    <strong>Name:</strong> {questions.interviewSession.candidate_name}
                                </p>
                                <p className={cx('common-info__personal-data')}>
                                    {/* TODO: Should show position instead of cv_application_id */}
                                    <strong>Position:</strong> {questions.interviewSession.cv_application_id}
                                </p>
                                <p className={cx('common-info__personal-data')}>
                                    <strong>Interviewer:</strong> {questions.interviewSession.interviewer_name}
                                </p>
                                <p className={cx('common-info__personal-data')}>
                                    <strong>Datetime:</strong> {new Date(questions.interviewSession.interview_datetime).toLocaleString()}
                                </p>
                            </div>
                            <hr style={{ margin: '20px 0 30px' }} />

                            {questions?.loading ? (
                                <Spinner label="Generating interview questions, please wait for some times!" />
                            ) : (
                                <div>
                                    <div className={cx('generation-question')}>
                                        <Button type="question" onClick={regenerateInterviewQuestions} />
                                        <span>Regenerate Questions</span>
                                    </div>

                                    {!questions.interviewQuestions ? (
                                        <div className={cx('no-question')}>
                                            <img src={dataEmpty} alt="There are no question available." width={80} />
                                        </div>
                                    ) : (
                                        questions.interviewQuestions?.map((question, index) => (
                                            <div key={question.id} className={cx('question')}>
                                                <p className={cx('question__item', 'question__item--ask')}>
                                                    <FaQuestionCircle className={cx('question__icon', 'question__icon--ask')} />
                                                    <strong>
                                                        Question {index + 1}: {question.original_question}
                                                    </strong>
                                                </p>
                                                <p className={cx('question__item')}>
                                                    <FaCommentDots className={cx('question__icon', 'question__icon--answer')} /> {question.answer}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </ReviewModal>
            </div>
        </>
    );
};

export default AdminInterviewList;
