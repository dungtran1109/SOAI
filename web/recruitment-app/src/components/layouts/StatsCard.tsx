import classNames from 'classnames/bind';
import styles from '../../assets/styles/layouts/statsCard.module.scss';

const cx = classNames.bind(styles);

interface StatsCardProps {
    label: string;
    count: number;
    icon: string;
}

const StatsCard = ({ label, count, icon }: StatsCardProps) => {
    return (
        <div className={cx('stats-card')}>
            <div className={cx('stats-card__header')}>
                <div className={cx('stats-card__icon')}>
                    <img src={icon} alt={label} />
                </div>
            </div>
            <div className={cx('stats-card__count')}>{count}</div>
            <div className={cx('stats-card__label')}>{label}</div>
        </div>
    );
};

export default StatsCard;
