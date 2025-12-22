import { Link, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PUBLIC_ROUTE } from '../../shared/constants/routes';
import { FiLogOut, FiUser } from 'react-icons/fi';
import { logout } from '../../services/api/authApi';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/users/userHeader.module.scss';
import logo from '../../assets/images/logo.png';
import userDefaultImage from '../../assets/images/user-default.png';

const cx = classNames.bind(styles);

const UserHeader = () => {
    const handleLogout = (): void => {
        const response = logout();
        if (response.ok) {
            toast.success(`Goodbye 👋, See you later.`, {
                position: 'top-center',
                hideProgressBar: true,
            });
        } else {
            toast.error(response.message, {
                position: 'top-center',
                hideProgressBar: true,
            });
        }
    };

    return (
        <>
            <header className={cx('header')}>
                <div className={cx('header__left')}>
                    <img src={logo} alt="Smart Recruiter" width={40} />

                    <nav className={cx('header__nav')}>
                        <Link to={PUBLIC_ROUTE.openJob} className={cx('header__nav-item')}>
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
                        <Link className={cx('header__dropdown-link')} to="#">
                            <FiUser size={15} /> <span>My profile</span>
                        </Link>
                        <Link className={cx('header__dropdown-link')} to="/signin" onClick={handleLogout}>
                            <FiLogOut size={15} /> <span>Sign out</span>
                        </Link>
                    </nav>
                </div>
            </header>
            <Outlet />
        </>
    );
};

export default UserHeader;
