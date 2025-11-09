import type React from 'react';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/layouts/badge.module.scss';
import type { Status } from '../../shared/types/adminTypes';

const cx = classNames.bind(styles);

interface BadgeProps {
    type?: Status;
    label: string | React.ReactNode;
    className?: string;
}

const Badge = ({ label, className, type = 'Accepted' }: BadgeProps) => {
    return <div className={cx('badge', `badge-${type.toLowerCase()}`, className)}>{label}</div>;
};

export default Badge;
