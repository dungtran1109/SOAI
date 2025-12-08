import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { toast } from 'react-toastify';
import { FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import { FaCalendarAlt, FaCommentDots, FaPen, FaQuestionCircle, FaRegEdit } from 'react-icons/fa';
import { getApprovedCVs } from '../../services/api/cvApi';
import {
    getInterviews,
    scheduleInterview,
    acceptInterview,
    cancelInterview,
    deleteInterview,
    generateInterviewQuestions,
    getAvailableInterviewQuestions,
} from '../../services/api/interviewApi';
import { Button, ReviewModal, Spinner, Row, Col } from '../layouts';
import { STATUS } from '../../shared/types/adminTypes';
import { initInterviewFilterValue, interviewFilterReducer } from '../../services/reducer/filterReducer/interviewFilter';
import type { CV, Interview, InterviewQuestion, InterviewSession, InterviewSchedule, Status } from '../../shared/types/adminTypes';
import classNames from 'classnames/bind';
import frameStyles from '../../assets/styles/admins/adminFrame.module.scss';
import styles from '../../assets/styles/admins/adminInterviewList.module.scss';
import dataEmpty from '../../assets/images/data-empty.png';

const cx = classNames.bind({ ...frameStyles, ...styles });

interface InterviewScheduleModal {
    formData: InterviewSchedule;
    formConfirm: boolean;
}

interface InterviewSessionModal {
    formData: InterviewSession;
    formConfirm: boolean;
}

interface InterviewQuestionModal {
    interviewSession: Interview;
    interviewQuestions: InterviewQuestion[];
    isGenerating: boolean;
}

const AdminInterviewList = () => {
    const [approvedCVs, setApprovedCVs] = useState<CV[]>([]);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [filter, dispatchFilter] = useReducer(interviewFilterReducer, initInterviewFilterValue);

    // States of modals
    const [schedule, setSchedule] = useState<InterviewScheduleModal | null>(null);
    const [session, setSession] = useState<InterviewSessionModal | null>(null);
    const [questions, setQuestions] = useState<InterviewQuestionModal | null>(null);

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
        let filteredInterviews = interviews.filter((interview) => interview.candidate_name.toLowerCase().includes(filter.candidateName.toLowerCase()));
        // Sort by interview datetime
        filteredInterviews = filteredInterviews.sort((a, b) => new Date(a.interview_datetime).getTime() - new Date(b.interview_datetime).getTime());
        return filteredInterviews;
    }, [filter.candidateName, interviews]);

    const filteredApprovedCVs = useMemo<typeof approvedCVs>(() => {
        const scheduledCVs = filteredInterviews.map((cv) => cv.cv_application_id);
        const filteredApprovedCVs = approvedCVs.filter(
            (cv) => cv.candidate_name.toLowerCase().includes(filter.candidateName.toLowerCase()) && !scheduledCVs.includes(cv.id),
        );
        return filteredApprovedCVs;
    }, [approvedCVs, filter.candidateName, filteredInterviews]);

    const openScheduleModal = (cv: CV): void => {
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

    const handleInterviewSchedule = useCallback(
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

    const openSessionModal = (session: Interview): void => {
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

    const handleInterviewSession = useCallback(
        async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
            e.preventDefault();
            let response = { message: 'Please update the status—processing cannot continue while it remains Pending.' };
            if (session?.formData.status === 'Accepted') {
                response = await acceptInterview(session.formData);
            } else if (session?.formData.status === 'Rejected') {
                response = await cancelInterview(session.formData.id);
            }
            fetchApprovedCVsAndInterviews();
            setSession(null);
            // TODO: Separate between toast.success and toast.error
            toast.success(response.message, {
                position: 'top-center',
                hideProgressBar: true,
            });
        },
        [fetchApprovedCVsAndInterviews, session?.formData],
    );

    const openInterviewQuestionModal = async (interviewSession: Interview): Promise<void> => {
        setQuestions({ interviewQuestions: [], interviewSession: interviewSession, isGenerating: true });
        let questions = await getAvailableInterviewQuestions(interviewSession.cv_application_id);
        if (questions.length === 0) {
            questions = await generateInterviewQuestions(interviewSession.cv_application_id);
        }
        setQuestions({ interviewQuestions: questions, interviewSession: interviewSession, isGenerating: false });
    };

    const closeInterviewQuestionModal = useCallback((): void => {
        if (questions?.isGenerating) {
            toast.warning('Closing the dialog is disabled during interview question generation.', {
                position: 'top-center',
                hideProgressBar: true,
            });
        } else {
            setQuestions(null);
        }
    }, [questions?.isGenerating]);

    const regenerateInterviewQuestions = async () => {
        if (questions?.interviewSession) {
            if (!questions.interviewQuestions || window.confirm('Do you want to regenerate interview questions?')) {
                setQuestions({ ...questions, isGenerating: true });
                const response = await generateInterviewQuestions(questions.interviewSession.cv_application_id);
                setQuestions({ ...questions, interviewQuestions: response, isGenerating: false });
                toast.success('Questions are generated successfully.', {
                    position: 'top-center',
                    hideProgressBar: true,
                });
            }
        }
    };

    const deleteInterviewCard = async (interviewCard: Interview) => {
        if (window.confirm(`Are you sure to delete the interview session of ${interviewCard.candidate_name}?`)) {
            const response = await deleteInterview(interviewCard.id);
            fetchApprovedCVsAndInterviews();
            // TODO: Separate between toast.success and toast.error
            toast.success(response.message, {
                position: 'top-center',
                hideProgressBar: true,
            });
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
                                <div key={cv.id} className={cx('interview-col__card')}>
                                    <div className={cx('interview-col__card-header')}>
                                        <h3>{cv.candidate_name.toUpperCase()}</h3>

                                        <section className={cx('card-header-popup')}>
                                            <div className={cx('card-header-popup__icon')}>
                                                <FiMoreVertical size={18} />
                                            </div>

                                            <div className={cx('card-header-popup__selection')}>
                                                <p className={cx('card-header-popup__selection-option')} onClick={() => openScheduleModal(cv)}>
                                                    <FaCalendarAlt
                                                        size={12}
                                                        className={cx(
                                                            'card-header-popup__selection-option-icon',
                                                            'card-header-popup__selection-option-icon--schedule',
                                                        )}
                                                    />
                                                    Schedule session
                                                </p>
                                            </div>
                                        </section>
                                    </div>

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

                                            {/* TODO: Replace the missed information */}
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
                                                    <strong>Datetime:</strong> {new Date(interview.interview_datetime).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ),
                            )}
                        </section>
                    </Col>

                    <Col size={{ md: 4, lg: 4, xl: 4 }} className={cx('interview-col')}>
                        <h3 className={cx('interview-col__title', 'interview-col__title--result')}>Result of Interviews</h3>

                        <section className={cx('interview-col__section')}>
                            {filteredInterviews.map(
                                (interview) =>
                                    interview.status !== 'Pending' && (
                                        <div key={interview.id} className={cx('interview-col__card')}>
                                            <div className={cx('interview-col__card-header')}>
                                                <h3>
                                                    {interview.status === 'Accepted' && <span title="Passed">⭐ ⭐</span>}{' '}
                                                    {interview.candidate_name.toUpperCase()}
                                                </h3>

                                                <section className={cx('card-header-popup')}>
                                                    <div className={cx('card-header-popup__icon')}>
                                                        <FiMoreVertical size={18} />
                                                    </div>

                                                    <div className={cx('card-header-popup__selection')}>
                                                        <p className={cx('card-header-popup__selection-option')} onClick={() => deleteInterviewCard(interview)}>
                                                            <FiTrash2
                                                                size={12}
                                                                className={cx(
                                                                    'card-header-popup__selection-option-icon',
                                                                    'card-header-popup__selection-option-icon--delete',
                                                                )}
                                                            />
                                                            Delete candidate
                                                        </p>
                                                    </div>
                                                </section>
                                            </div>

                                            {/* TODO: Replace the missed information */}
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
                                                    <strong>Datetime:</strong> {new Date(interview.interview_datetime).toLocaleString()}
                                                </p>
                                                <p className={cx('interview-col__card-content-item')}>
                                                    <strong>Status:</strong> {interview.status}
                                                </p>
                                            </div>
                                        </div>
                                    ),
                            )}
                        </section>
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
                            <form onSubmit={handleInterviewSchedule}>
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
                            <form onSubmit={handleInterviewSession}>
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
                <ReviewModal title={`Interview Questions`} open={!!questions} onClose={closeInterviewQuestionModal}>
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

                            {questions.isGenerating ? (
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
                                            <section key={question.id} className={cx('question')}>
                                                <strong className={cx('question__item', 'question__item--ask')}>
                                                    <FaQuestionCircle className={cx('question__icon', 'question__icon--ask')} />
                                                    Question {index + 1}: {question.original_question}
                                                </strong>
                                                <p className={cx('question__item')}>
                                                    <FaCommentDots className={cx('question__icon', 'question__icon--answer')} />
                                                    {question.answer}
                                                </p>
                                            </section>
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
