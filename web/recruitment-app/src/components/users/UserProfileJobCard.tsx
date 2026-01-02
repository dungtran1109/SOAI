import React from 'react';
import { Col, Row } from '../layouts';
import { FiAirplay, FiMail, FiUpload, FiUser } from 'react-icons/fi';
import type { AppliedJob } from '../../shared/types/userTypes';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/users/userProfileJobCard.module.scss';
import Logo from '../../assets/images/logo.png';

const cx = classNames.bind(styles);

interface UserAppliedJobCardProps {
    job: AppliedJob;
    onUploadProof: (files: FileList, cvId: number) => void;
}

const UserAppliedJobCard = React.memo(({ job, onUploadProof }: UserAppliedJobCardProps) => {
    const handleUploadProofImages = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        e.preventDefault();
        const files = e.target.files;
        if (!files?.length) return;
        onUploadProof(files, job.id);
    };

    const isAccepted = job.status === 'Accepted';

    return (
        <Row space={6} className={cx('card')}>
            <Col size={{ xs: 12, sm: 12, md: 2, lg: 1, xl: 1 }} className={cx('card__logo')}>
                <img src={Logo} alt="Logo" height={60} />
            </Col>
            <Col size={{ xs: 12, sm: 12, md: 10, lg: 11, xl: 11 }} className={cx('card__jobs')}>
                <h2 className={cx('card__jobs-title')}>{job.position}</h2>

                <Row space={20} className={cx('card__jobs-item')}>
                    <Col size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }} className={cx('card__jobs-item-info')}>
                        <FiUser size={16} />
                        <span>{job.candidate_name}</span>
                    </Col>

                    <Col size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }} className={cx('card__jobs-item-info')}>
                        <FiMail size={16} />
                        <span>{job.email}</span>
                    </Col>

                    <Col size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }} className={cx('card__jobs-item-info')}>
                        <FiAirplay size={16} />
                        <span className={cx(`card__jobs-item-info-status-${job.status.toLowerCase()}`)}>{job.status}</span>
                    </Col>

                    <Col size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }} className={cx('card__jobs-item-info')}>
                        <FiUpload size={16} />
                        <label
                            htmlFor={`proof-upload-${job.id}`}
                            className={cx('card__jobs-item-info-upload-proof', { 'card__jobs-item-info-upload-proof--disable': !isAccepted })}
                        >
                            Upload Proof
                        </label>
                        <input
                            id={`proof-upload-${job.id}`}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleUploadProofImages}
                            hidden
                            disabled={!isAccepted}
                        />
                    </Col>
                </Row>
            </Col>
        </Row>
    );
});

export default UserAppliedJobCard;
