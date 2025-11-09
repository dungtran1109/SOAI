import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminCVList.module.scss';
import frameStyles from '../../assets/styles/admins/adminFrame.module.scss';
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { toast } from 'react-toastify';
import { FiTrash2 } from 'react-icons/fi';
import { FaFilter, FaPen } from 'react-icons/fa';
import { Col, Row, Badge, ReviewModal } from '../layouts';
import { getCVByPosition, getCVPreviewUrl, updateCV, deleteCV } from '../../shared/apis/cvApis';
import { STATUS, type CandidateCV, type Status } from '../../shared/types/adminTypes';

const cx = classNames.bind({ ...frameStyles, ...styles });

type ColumnName = 'Candidate Name' | 'Position' | 'Status' | 'Email' | 'Score' | 'Action';

interface AdminCVListProps {
    disableColumns?: ColumnName[];
}

interface Filter {
    sortBy: 'ASCENDING' | 'DESCENDING';
    candidateName: string;
    positions: string[];
    status: Status[];
    minimumScore: number;
}

const initFilterValue: Filter = {
    sortBy: 'DESCENDING',
    candidateName: '',
    positions: [],
    status: [...STATUS],
    minimumScore: 0,
};

type FilterAction =
    | { type: 'SORT_BY'; payload: 'ASCENDING' | 'DESCENDING' }
    | { type: 'CANDIDATE_NAME'; payload: string }
    | { type: 'POSITION'; payload: string | string[] }
    | { type: 'MINIMUM_SCORE'; payload: number }
    | { type: 'STATUS'; payload: Status };

const filterReducer = (state: Filter, action: FilterAction): Filter => {
    switch (action.type) {
        case 'SORT_BY':
            return { ...state, sortBy: action.payload };
        case 'CANDIDATE_NAME':
            return { ...state, candidateName: action.payload };
        case 'POSITION':
            // Support loading a position list at the first time
            if (Array.isArray(action.payload)) {
                return {
                    ...state,
                    positions: [...action.payload],
                };
            }
            // Sub or add a position at the next times
            return {
                ...state,
                positions: state.positions.includes(action.payload)
                    ? state.positions.filter((pos) => pos !== action.payload)
                    : [...state.positions, action.payload],
            };
        case 'STATUS':
            return {
                ...state,
                status: state.status.includes(action.payload) ? state.status.filter((status) => status !== action.payload) : [...state.status, action.payload],
            };
        case 'MINIMUM_SCORE':
            return { ...state, minimumScore: action.payload };
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
            const data: typeof cvs = await getCVByPosition(position);
            setCVs(data);
        } catch (error) {
            console.error('Failed to fetch candidate application:', error);
        }
    }, []);

    useEffect(() => {
        fetchCVs();
    }, [fetchCVs]);

    const filteredCVs = useMemo<typeof cvs>(() => {
        const filteredCVs = cvs.filter(
            (cv) =>
                cv.candidate_name.toLowerCase().includes(filter.candidateName.toLowerCase()) &&
                filter.positions.includes(cv.position) &&
                filter.status.includes(cv.status) &&
                cv.matched_score >= filter.minimumScore,
        );

        filteredCVs.sort((a, b) => {
            const scoreA = a.matched_score ?? 0;
            const scoreB = b.matched_score ?? 0;
            return filter.sortBy === 'ASCENDING' ? scoreA - scoreB : scoreB - scoreA;
        });
        return filteredCVs;
    }, [filter, cvs]);

    const uniquePositions = useMemo<string[]>(() => [...new Set(cvs.map((cv) => cv.position).filter(Boolean))], [cvs]);

    // Load a position list to filters as initValues
    useEffect(() => {
        dispatchFilter({ type: 'POSITION', payload: uniquePositions });
    }, [uniquePositions]);

    const handleEditSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
            e.preventDefault();
            if (editCV) {
                const cv = cvs.find((cv) => cv.id === editCV.id);
                if (JSON.stringify(cv) === JSON.stringify(editCV)) {
                    toast.warning('No changes detected!', {
                        position: 'top-center',
                        hideProgressBar: true,
                    });
                } else {
                    await updateCV(editCV);
                    fetchCVs();
                    setEditCV(null);
                    toast.success('Saved', {
                        position: 'top-center',
                        hideProgressBar: true,
                    });
                }
            }
        },
        [cvs, editCV, fetchCVs],
    );

    const handleEditClose = useCallback((): void => {
        if (editCV) {
            const cv = cvs.find((cv) => cv.id === editCV.id);
            if (JSON.stringify(cv) !== JSON.stringify(editCV)) {
                if (window.confirm('You have unsaved changes. Are you sure you want to leave without saving?')) {
                    setEditCV(null);
                }
            } else {
                setEditCV(null);
            }
        }
    }, [cvs, editCV]);

    const handleDeleteCV = async (cv: CandidateCV) => {
        if (window.confirm(`Are you sure you want to delete the CV of ${cv.candidate_name}?`)) {
            await deleteCV(cv.id);
            fetchCVs();
        }
    };

    // Support closing modal when pressing ESC key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowCV(null);
                handleEditClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleEditClose]);

    return (
        <>
            <div className={cx('admin-frame')}>
                <div className={cx('admin-frame-header')}>
                    <h2 className={cx('admin-frame-header__title')}>CV List</h2>
                    <p className={cx('admin-frame-header__subtitle')}>Manage all candidate CVs submitted to the system.</p>
                </div>

                <Row space={10} className={cx('admin-frame-filter')}>
                    {!disableColumns.includes('Candidate Name') && (
                        <Col size={{ sm: 5, md: 3, lg: 3, xl: 3 }}>
                            <input
                                type="text"
                                placeholder="Search by candidate name"
                                className={cx('admin-frame-filter__entry')}
                                onChange={(e) => dispatchFilter({ type: 'CANDIDATE_NAME', payload: e.target.value })}
                            />
                        </Col>
                    )}
                    {!disableColumns.includes('Score') && (
                        <Col size={{ sm: 5, md: 3, lg: 2, xl: 2 }}>
                            <input
                                type="number"
                                placeholder="Minimum Score"
                                className={cx('admin-frame-filter__entry')}
                                min={0}
                                onChange={(e) => dispatchFilter({ type: 'MINIMUM_SCORE', payload: Number(e.target.value) })}
                            />
                        </Col>
                    )}
                </Row>

                <table className={cx('admin-table')}>
                    <thead>
                        <tr>
                            {!disableColumns.includes('Candidate Name') && <th className={cx('admin-table__column-title')}>Candidate Name</th>}
                            {!disableColumns.includes('Position') && (
                                <th className={cx('admin-table__column-title')}>
                                    Position
                                    <section className={cx('admin-table__filter')}>
                                        <span
                                            className={cx('admin-table__filter-icon', {
                                                'admin-table__filter-icon--filtered': filter.positions.length > 0,
                                            })}
                                        >
                                            <FaFilter />
                                        </span>

                                        <div className={cx('admin-table__filter-section')}>
                                            {uniquePositions.map((pos) => (
                                                <label key={pos} className={cx('admin-table__filter-section-option')}>
                                                    <input
                                                        type="checkbox"
                                                        checked={filter.positions.includes(pos)}
                                                        onChange={() => dispatchFilter({ type: 'POSITION', payload: pos })}
                                                    />
                                                    {pos}
                                                </label>
                                            ))}
                                        </div>
                                    </section>
                                </th>
                            )}
                            {!disableColumns.includes('Status') && (
                                <th className={cx('admin-table__column-title')}>
                                    Status
                                    <section className={cx('admin-table__filter')}>
                                        <span
                                            className={cx('admin-table__filter-icon', {
                                                'admin-table__filter-icon--filtered': filter.status.length > 0,
                                            })}
                                        >
                                            <FaFilter />
                                        </span>

                                        <div className={cx('admin-table__filter-section')}>
                                            {STATUS.map((status) => (
                                                <label key={status} className={cx('admin-table__filter-section-option')}>
                                                    <input
                                                        type="checkbox"
                                                        checked={filter.status.includes(status)}
                                                        onChange={() => dispatchFilter({ type: 'STATUS', payload: status })}
                                                    />
                                                    {status}
                                                </label>
                                            ))}
                                        </div>
                                    </section>
                                </th>
                            )}
                            {!disableColumns.includes('Email') && <th className={cx('admin-table__column-title')}>Email</th>}
                            {!disableColumns.includes('Score') && (
                                <th className={cx('admin-table__column-title')}>
                                    Score
                                    <section className={cx('admin-table__filter')}>
                                        <button
                                            className={cx('admin-table__filter-btn', 'admin-table__filter-btn--filtered')}
                                            onClick={() =>
                                                dispatchFilter({ type: 'SORT_BY', payload: filter.sortBy === 'ASCENDING' ? 'DESCENDING' : 'ASCENDING' })
                                            }
                                            title={filter.sortBy === 'ASCENDING' ? 'Sort Ascending' : 'Sort Descending'}
                                        >
                                            {filter.sortBy === 'ASCENDING' ? '▲' : '▼'}
                                        </button>
                                    </section>
                                </th>
                            )}
                            {!disableColumns.includes('Action') && <th className={cx('admin-table__column-title')}>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCVs.map((cv) => (
                            <tr key={cv.id}>
                                {!disableColumns.includes('Candidate Name') && <td className={cx('admin-table__column-value')}>{cv.candidate_name}</td>}
                                {!disableColumns.includes('Position') && <td className={cx('admin-table__column-value')}>{cv.position}</td>}
                                {!disableColumns.includes('Status') && (
                                    <td className={cx('admin-table__column-value')}>
                                        <Badge type={cv.status} label={cv.status} />
                                    </td>
                                )}
                                {!disableColumns.includes('Email') && (
                                    <td className={cx('admin-table__column-value')}>
                                        <a href={`mailto:${cv.email}`}>{cv.email}</a>
                                    </td>
                                )}
                                {!disableColumns.includes('Score') && (
                                    <td className={cx('admin-table__column-value')}>
                                        <a onClick={() => setShowCV({ ...cv })} title="Review">
                                            {cv.matched_score}
                                        </a>
                                    </td>
                                )}
                                {!disableColumns.includes('Action') && (
                                    <td className={cx('admin-table__column-value')}>
                                        <div className={cx('admin-table__action')}>
                                            <button className={cx('admin-table__action-btn')} onClick={() => setEditCV({ ...cv })} title="Edit">
                                                <FaPen />
                                            </button>
                                            <button
                                                className={cx('admin-table__action-btn', 'admin-table__action-btn--delete')}
                                                onClick={() => handleDeleteCV(cv)}
                                                title="Delete"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Candidate modals */}
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
                        <div className={cx('show-cv-modal-ai-review')}>
                            <h3>Reviewed by AI</h3>
                            <div className={cx('show-cv-modal-ai-review__assessment')}>
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

            <ReviewModal open={!!editCV} title="Edit Candidate Information" onClose={handleEditClose} width={500}>
                {editCV && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleEditSubmit}>
                            <div className={cx('edit-modal-form-group')}>
                                <label htmlFor="candidate-name" className={cx('edit-modal-form-group__label')}>
                                    Name
                                </label>
                                <input
                                    id="candidate-name"
                                    type="text"
                                    value={editCV.candidate_name}
                                    onChange={(e) => setEditCV({ ...editCV, candidate_name: e.target.value })}
                                    className={cx('edit-modal-form-group__entry')}
                                    required
                                />
                            </div>

                            <div className={cx('edit-modal-form-group')}>
                                <label htmlFor="candidate-email" className={cx('edit-modal-form-group__label')}>
                                    Email
                                </label>
                                <input
                                    id="candidate-email"
                                    type="email"
                                    value={editCV.email}
                                    onChange={(e) => setEditCV({ ...editCV, email: e.target.value })}
                                    className={cx('edit-modal-form-group__entry')}
                                    required
                                />
                            </div>

                            <div className={cx('edit-modal-form-group')}>
                                <label htmlFor="candidate-score" className={cx('edit-modal-form-group__label')}>
                                    Score
                                </label>
                                <input
                                    id="candidate-score"
                                    type="number"
                                    value={editCV.matched_score}
                                    onChange={(e) => setEditCV({ ...editCV, matched_score: parseFloat(e.target.value) })}
                                    min={0}
                                    max={100}
                                    className={cx('edit-modal-form-group__entry')}
                                    required
                                />
                            </div>

                            <div className={cx('edit-modal-form-group')}>
                                <label htmlFor="candidate-position" className={cx('edit-modal-form-group__label')}>
                                    Position
                                </label>
                                <input
                                    id="candidate-position"
                                    type="text"
                                    value={editCV.position}
                                    onChange={(e) => setEditCV({ ...editCV, position: e.target.value })}
                                    className={cx('edit-modal-form-group__entry')}
                                    required
                                    disabled
                                />
                            </div>

                            <div className={cx('edit-modal-form-group')}>
                                <label htmlFor="candidate-status" className={cx('edit-modal-form-group__label')}>
                                    Status
                                </label>
                                <select
                                    id="candidate-status"
                                    value={editCV.status}
                                    onChange={(e) => setEditCV({ ...editCV, status: e.target.value as Status })}
                                    className={cx('edit-modal-form-group__entry')}
                                >
                                    {STATUS.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button className={cx('edit-cv-modal-form-submit-btn')} type="submit">
                                Save Changes
                            </button>
                        </form>
                    </div>
                )}
            </ReviewModal>
        </>
    );
};

export default AdminCVList;
