import classNames from 'classnames/bind';
import styles from '../../assets/styles/modules/badge.module.scss';

const cx = classNames.bind(styles);

interface BadgeProps {
    type: 'Accepted' | 'Rejected' | 'Pending';
    label: string;
    className?: string;
}

const Badge = ({ type, label, className }: BadgeProps) => {
    return <div className={cx('badge', `badge-${type.toLowerCase()}`, className)}>{label}</div>;
};

export default Badge;
