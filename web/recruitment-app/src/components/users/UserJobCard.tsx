import React from 'react';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/users/userJobCard.module.scss';
import { FiDollarSign, FiMapPin } from 'react-icons/fi';
import type { JD } from '../../shared/types/adminTypes';

const cx = classNames.bind(styles);

interface UserJobCardProps {
    job: JD;
    onClick: (jd: JD) => void;
    highlight?: boolean;
}

const calculateDays = (date: string): number => {
    const startDate = new Date(date);
    const today = new Date();

    const diffTime = today.getTime() - startDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const UserJobCard = React.memo(({ job, onClick, highlight = false }: UserJobCardProps) => {
    return (
        <div className={cx('job', { 'job-highlight': highlight })} onClick={() => onClick(job)}>
            <p className={cx('job__datetime')}>Posted {calculateDays(job.datetime)} days ago</p>
            <h3 className={cx('job__title')}>
                [{job.level}] {job.position}
            </h3>
            <p className={cx('job__salary')}>
                <FiDollarSign />
                <span>You'll love it</span>
            </p>
            <address className={cx('job__location')}>
                <FiMapPin />
                <span>{job.location}</span>
            </address>
        </div>
    );
});

export default UserJobCard;
