import classNames from 'classnames/bind';
import styles from '../../assets/styles/layouts/spinner.module.scss';

const cx = classNames.bind(styles);

interface SpinnerProps {
    label?: string;
}

const Spinner = ({ label = 'Loading' }: SpinnerProps) => {
    return (
        <div className={cx('spinner')}>
            <div className={cx('spinner__rotate')}></div>
            <p className={cx('spinner__label')}>{label}</p>
        </div>
    );
};

export default Spinner;
