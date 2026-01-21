import { Link } from 'react-router-dom';
import { FiArrowLeftCircle } from 'react-icons/fi';
import { PRIVATE_ADMIN_ROUTE, PRIVATE_USER_ROUTE, PUBLIC_ROUTE } from '../shared/constants/routes';
import { useSelector } from 'react-redux';
import type { RootState } from '../services/redux/store';
import notFound from '../assets/images/not-found.png';
import classNames from 'classnames/bind';
import styles from '../assets/styles/layouts/notFoundPage.module.scss';

const cx = classNames.bind(styles);

const NotFoundPage = () => {
    const userAuthen = useSelector((state: RootState) => state.authenSession);

    return (
        <div className={cx('not-found-wrapper')}>
            <div className={cx('not-found-wrapper__block')}>
                <img src={notFound} alt="404 Not Found" />
                <strong className={cx('not-found-wrapper__block-label')}>
                    <FiArrowLeftCircle /> Back to
                    <Link
                        to={
                            userAuthen.isAuthen
                                ? userAuthen.role === 'ADMIN'
                                    ? PRIVATE_ADMIN_ROUTE.dashboard
                                    : PRIVATE_USER_ROUTE.openJob
                                : PUBLIC_ROUTE.signin
                        }
                        replace
                    >
                        {userAuthen.isAuthen ? 'Home' : 'Login'}
                    </Link>
                </strong>
            </div>
        </div>
    );
};

export default NotFoundPage;
