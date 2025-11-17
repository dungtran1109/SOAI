import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminStatisticCard.module.scss';

const cx = classNames.bind(styles);

interface AdminStatisticCardProps {
    label: string;
    count: number;
    icon: string;
    indicator?: {
        type: 'UP' | 'DOWN';
        value: number;
    };
}

const AdminStatisticCard = ({ label, count, icon, indicator }: AdminStatisticCardProps) => {
    return (
        <div className={cx('admin-statistic-card')}>
            <div className={cx('admin-statistic-card__header')}>
                <div className={cx('admin-statistic-card__icon')}>
                    <img src={icon} alt={label} />
                </div>
                {indicator && (
                    <div className={cx('admin-statistic-card__indicator', `admin-statistic-card__indicator--${indicator.type.toLowerCase()}`)}>
                        {indicator.type === 'UP' ? '▲' : '▼'} {indicator.value}
                    </div>
                )}
            </div>
            <div className={cx('admin-statistic-card__count')}>{count}</div>
            <div className={cx('admin-statistic-card__label')}>{label}</div>
        </div>
    );
};

export default AdminStatisticCard;
