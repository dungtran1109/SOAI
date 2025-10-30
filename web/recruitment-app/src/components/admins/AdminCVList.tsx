import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminCVList.module.scss';
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { Col, Row, Badge, ReviewModal } from '../layouts';
import { fetchCVsByPosition, getCVPreviewUrl, updateCV } from '../../shared/api/cvApi';
import type { CandidateCV, Status } from '../../shared/interfaces/adminInterface';
import { FaPen, FaTrash } from 'react-icons/fa';

const cx = classNames.bind(styles);

type ColumnName = 'Candidate Name' | 'Position' | 'Status' | 'Email' | 'Score' | 'Action';

interface AdminCVListProps {
    disableColumns?: ColumnName[];
}

interface Filter {
    sortBy: 'ASCENDING' | 'DESCENDING';
    candidateName: string;
    minimumScore: number;
}

type FilterAction =
    | { type: 'SORT_BY'; payload: 'ASCENDING' | 'DESCENDING' }
    | { type: 'CANDIDATE_NAME'; payload: string }
    | { type: 'MINIMUM_SCORE'; payload: number }
    | { type: 'RESET' };

const initFilterValue: Filter = {
    sortBy: 'DESCENDING',
    candidateName: '',
    minimumScore: 0,
};

const filterReducer = (state: Filter, action: FilterAction): Filter => {
    switch (action.type) {
        case 'SORT_BY':
            return { ...state, sortBy: action.payload };
        case 'CANDIDATE_NAME':
            return { ...state, candidateName: action.payload };
        case 'MINIMUM_SCORE':
            return { ...state, minimumScore: action.payload };
        case 'RESET':
            return initFilterValue;
        default:
            return state;
    }
};

const AdminCVList = ({ disableColumns = [] }: AdminCVListProps) => {
    const [cvs, setCVs] = useState<CandidateCV[]>([]);
    const [showCV, setShowCV] = useState<CandidateCV | null>(null);
    const [editCV, setEditCV] = useState<CandidateCV | null>(null);
    const [filter, dispatchFilter] = useReducer(filterReducer, initFilterValue);

    const fetchCVs = useCallback(async (position: string = '') => {
        try {
            const data: typeof cvs = await fetchCVsByPosition(position);
            setCVs(data);
        } catch (error) {
            console.error('Failed to fetch candidate application:', error);
        }
    }, []);

    useEffect(() => {
        console.log('abc');
        fetchCVs();
    }, [fetchCVs]);

    // Support closing modal when pressing ESC key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowCV(null);
                setEditCV(null);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const filteredCVs = useMemo<typeof cvs>(() => {
        const filteredCVs = cvs.filter(
            (cv) => cv.candidate_name.toLowerCase().includes(filter.candidateName.toLowerCase()) && cv.matched_score >= filter.minimumScore,
        );
        filteredCVs.sort((a, b) => {
            const scoreA = a.matched_score ?? 0;
            const scoreB = b.matched_score ?? 0;
            return filter.sortBy === 'ASCENDING' ? scoreA - scoreB : scoreB - scoreA;
        });
        return filteredCVs;
    }, [filter, cvs]);

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (editCV) {
            await updateCV(editCV);
            fetchCVs();
        }
        setEditCV(null);
    };

    return (
        <div className={cx('admin-cv-list')}>
            <div className={cx('cv-list-header')}>
                <h2 className={cx('cv-list-header__title')}>CV List</h2>
                <p className={cx('cv-list-header__subtitle')}>Manage all candidateCVs submitted to the system.</p>
            </div>

            <div className={cx('cv-list-body')}>
                <Row space={10} className={cx('cv-list-filter')}>
                    <Col size={{ sm: 5, md: 3, lg: 2, xl: 1 }}>
                        <button
                            className={cx('cv-list-filter__sort-btn')}
                            onClick={() => dispatchFilter({ type: 'SORT_BY', payload: filter.sortBy === 'ASCENDING' ? 'DESCENDING' : 'ASCENDING' })}
                        >
                            Sort by {filter.sortBy.toLowerCase()}
                            <span
                                className={cx('cv-list-filter__sort-btn-arrow', { 'cv-list-filter__sort-btn-arrow--active': filter.sortBy === 'DESCENDING' })}
                            >
                                ▲
                            </span>
                        </button>
                    </Col>
                    <Col size={{ sm: 5, md: 3, lg: 3, xl: 3 }}>
                        <input
                            type="text"
                            placeholder="Search by candidate name"
                            className={cx('cv-list-filter__input')}
                            onChange={(e) => dispatchFilter({ type: 'CANDIDATE_NAME', payload: e.target.value })}
                        />
                    </Col>
                    <Col size={{ sm: 5, md: 3, lg: 3, xl: 3 }}>
                        <input
                            type="number"
                            placeholder="Minimum Score"
                            className={cx('cv-list-filter__input')}
                            min={0}
                            onChange={(e) => dispatchFilter({ type: 'MINIMUM_SCORE', payload: Number(e.target.value) })}
                        />
                    </Col>
                </Row>

                <table className={cx('cv-list-table')}>
                    <thead>
                        <tr>
                            {!disableColumns.includes('Candidate Name') && <th className={cx('cv-list-table__title')}>Candidate Name</th>}
                            {!disableColumns.includes('Position') && <th className={cx('cv-list-table__title')}>Position</th>}
                            {!disableColumns.includes('Status') && <th className={cx('cv-list-table__title')}>Status</th>}
                            {!disableColumns.includes('Email') && <th className={cx('cv-list-table__title')}>Email</th>}
                            {!disableColumns.includes('Score') && <th className={cx('cv-list-table__title')}>Score</th>}
                            {!disableColumns.includes('Action') && <th className={cx('cv-list-table__title')}>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCVs.map((cv) => (
                            <tr key={cv.id}>
                                {!disableColumns.includes('Candidate Name') && <td className={cx('cv-list-table__value')}>{cv.candidate_name}</td>}
                                {!disableColumns.includes('Position') && <td className={cx('cv-list-table__value')}>{cv.position}</td>}
                                {!disableColumns.includes('Status') && (
                                    <td className={cx('cv-list-table__value')}>
                                        <Badge type={cv.status} label={cv.status} />
                                    </td>
                                )}
                                {!disableColumns.includes('Email') && <td className={cx('cv-list-table__value')}>{cv.email}</td>}
                                {!disableColumns.includes('Score') && (
                                    <td className={cx('cv-list-table__value')}>
                                        <a onClick={() => setShowCV({ ...cv })}>{cv.matched_score}</a>
                                    </td>
                                )}
                                {!disableColumns.includes('Action') && (
                                    <td className={cx('cv-list-table__value')}>
                                        <div className={cx('cv-list-table__action')}>
                                            <button className={cx('cv-list-table__action-btn')} onClick={() => setEditCV({ ...cv })} title="Edit">
                                                <FaPen />
                                            </button>
                                            <button
                                                className={cx('cv-list-table__action-btn', 'cv-list-table__action-btn--delete')}
                                                onClick={() => console.log('status')}
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ReviewModal open={!!showCV} title="Candidate Details" onClose={() => setShowCV(null)}>
                {showCV && (
                    <>
                        <div className={cx('show-cv-modal-info')}>
                            <p className={cx('show-cv-modal-info__personal-data')}>
                                <strong>Name:</strong> {showCV.candidate_name}
                            </p>
                            <p className={cx('show-cv-modal-info__personal-data')}>
                                <strong>Email:</strong> {showCV.email}
                            </p>
                            <p className={cx('show-cv-modal-info__personal-data')}>
                                <strong>Position:</strong> {showCV.position}
                            </p>
                            <p className={cx('show-cv-modal-info__personal-data')}>
                                <strong>Score:</strong> {showCV.matched_score}
                            </p>
                        </div>
                        <hr />
                        <div className={cx('show-cv-modal-review')}>
                            <h3>Reviewed by AI</h3>
                            <div className={cx('show-cv-modal-review__assessment')}>
                                {showCV.justification.split('\n').map((line, idx) => (
                                    <span key={idx}>
                                        {line}
                                        <br />
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className={cx('show-cv-modal-iframe-container')} style={{ marginTop: '1rem' }}>
                            <iframe src={getCVPreviewUrl(showCV.id)} title="CV Preview" width="100%" height="600px" style={{ border: '1px solid #ccc' }} />
                        </div>
                    </>
                )}
            </ReviewModal>

            <ReviewModal open={!!editCV} title="Edit Candidate Information" onClose={() => setEditCV(null)} width={500}>
                {editCV && (
                    <div className={cx('edit-cv-modal')} onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleEditSubmit}>
                            <div className={cx('edit-cv-modal-form-group')}>
                                <label htmlFor="candidate-name" className={cx('edit-cv-modal-form-group__label')}>
                                    Name
                                </label>
                                <input
                                    id="candidate-name"
                                    type="text"
                                    value={editCV.candidate_name}
                                    onChange={(e) => setEditCV({ ...editCV, candidate_name: e.target.value })}
                                    className={cx('edit-cv-modal-form-group__entry')}
                                    required
                                />
                            </div>

                            <div className={cx('edit-cv-modal-form-group')}>
                                <label htmlFor="candidate-email" className={cx('edit-cv-modal-form-group__label')}>
                                    Email
                                </label>
                                <input
                                    id="candidate-email"
                                    type="email"
                                    value={editCV.email}
                                    onChange={(e) => setEditCV({ ...editCV, email: e.target.value })}
                                    className={cx('edit-cv-modal-form-group__entry')}
                                    required
                                />
                            </div>

                            <div className={cx('edit-cv-modal-form-group')}>
                                <label htmlFor="candidate-score" className={cx('edit-cv-modal-form-group__label')}>
                                    Score
                                </label>
                                <input
                                    id="candidate-score"
                                    type="number"
                                    value={editCV.matched_score}
                                    onChange={(e) => setEditCV({ ...editCV, matched_score: parseFloat(e.target.value) })}
                                    className={cx('edit-cv-modal-form-group__entry')}
                                    required
                                />
                            </div>

                            <div className={cx('edit-cv-modal-form-group')}>
                                <label htmlFor="candidate-position" className={cx('edit-cv-modal-form-group__label')}>
                                    Position
                                </label>
                                <input
                                    id="candidate-position"
                                    type="text"
                                    value={editCV.position}
                                    onChange={(e) => setEditCV({ ...editCV, position: e.target.value })}
                                    className={cx('edit-cv-modal-form-group__entry')}
                                    required
                                />
                            </div>

                            <div className={cx('edit-cv-modal-form-group')}>
                                <label htmlFor="candidate-status" className={cx('edit-cv-modal-form-group__label')}>
                                    Status
                                </label>
                                <select
                                    id="candidate-status"
                                    value={editCV.status}
                                    onChange={(e) => setEditCV({ ...editCV, status: e.target.value as Status })}
                                    className={cx('edit-cv-modal-form-group__entry')}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            <button className={cx('edit-cv-modal-form-submit-btn')} type="submit">
                                Save Changes
                            </button>
                        </form>
                    </div>
                )}
            </ReviewModal>
        </div>
    );
};

export default AdminCVList;
