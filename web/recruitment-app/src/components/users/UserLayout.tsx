import { useDispatch } from 'react-redux';
import { setUserLogout } from '../../services/redux/authSlices/authSlice';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { PRIVATE_USER_ROUTE, PUBLIC_ROUTE } from '../../shared/constants/routes';
import { FiLogOut, FiUser } from 'react-icons/fi';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/users/userLayout.module.scss';
import logo from '../../assets/images/logo.png';
import userDefaultImage from '../../assets/images/user-default.png';
import UserFooter from './UserFooter';

const cx = classNames.bind(styles);

const UserLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleUserLogout = (): void => {
        dispatch(setUserLogout());
    };

    return (
        <>
            <header className={cx('header')}>
                <div className={cx('header__left')}>
                    <img src={logo} alt="Smart Recruiter" className={cx('header__logo')} onClick={() => navigate(PRIVATE_USER_ROUTE.openJob)} />

                    <nav className={cx('header__nav')}>
                        <Link to={PRIVATE_USER_ROUTE.openJob} className={cx('header__nav-item')}>
                            All Jobs
                        </Link>
                        <Link to="#" className={cx('header__nav-item')}>
                            IT Company
                        </Link>
                    </nav>
                </div>

                <div className={cx('header__right')}>
                    <div className={cx('header__user')}>
                        <img src={userDefaultImage} alt="User" className={cx('header__user-img')} />
                        <div className={cx('header__user-icon')}>▾</div>
                    </div>

                    <nav className={cx('header__dropdown')}>
                        <Link className={cx('header__dropdown-link')} to={PRIVATE_USER_ROUTE.profile}>
                            <FiUser size={15} /> <span>My profile</span>
                        </Link>
                        <Link className={cx('header__dropdown-link')} to={PUBLIC_ROUTE.signin} onClick={handleUserLogout}>
                            <FiLogOut size={15} /> <span>Sign out</span>
                        </Link>
                    </nav>
                </div>
            </header>

            <Outlet />

            <UserFooter />
        </>
    );
};

export default UserLayout;
