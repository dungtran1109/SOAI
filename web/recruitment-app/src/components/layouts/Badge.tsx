import classNames from 'classnames/bind';
import styles from '../../assets/styles/layouts/badge.module.scss';
import type React from 'react';

const cx = classNames.bind(styles);

interface BadgeProps {
    type?: 'Accepted' | 'Rejected' | 'Pending';
    label: string | React.ReactNode;
    className?: string;
}

const Badge = ({ label, className, type = 'Accepted' }: BadgeProps) => {
    return <div className={cx('badge', `badge-${type.toLowerCase()}`, className)}>{label}</div>;
};

export default Badge;
