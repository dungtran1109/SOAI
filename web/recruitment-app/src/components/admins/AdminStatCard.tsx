import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminStatCard.module.scss';

const cx = classNames.bind(styles);

interface AdminStatCardProps {
    label: string;
    count: number;
    icon: string;
    indicator?: {
        type: 'UP' | 'DOWN';
        value: number;
    };
}

const AdminStatCard = ({ label, count, icon, indicator }: AdminStatCardProps) => {
    return (
        <div className={cx('admin-stat-card')}>
            <div className={cx('admin-stat-card__header')}>
                <div className={cx('admin-stat-card__icon')}>
                    <img src={icon} alt={label} />
                </div>
                {indicator && (
                    <div className={cx('admin-stat-card__indicator', `admin-stat-card__indicator--${indicator.type.toLowerCase()}`)}>
                        {indicator.type === 'UP' ? '▲' : '▼'} {indicator.value}
                    </div>
                )}
            </div>
            <div className={cx('admin-stat-card__count')}>{count}</div>
            <div className={cx('admin-stat-card__label')}>{label}</div>
        </div>
    );
};

export default AdminStatCard;
