import { Link, Outlet } from 'react-router-dom';
import { handleScrollIntoView } from '../../shared/helpers/commonUtils';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/suppliers/layout.module.scss';
import logo from '../../assets/images/logo.png';
import Footer from './Footer';
import { toast } from 'react-toastify';

const cx = classNames.bind(styles);

const Layout = () => {
    return (
        <>
            <header className={cx('header')}>
                <img src={logo} alt="Smart Recruiter" className={cx('header__logo')} />

                <nav className={cx('header__nav')}>
                    <Link to="/" className={cx('header__nav-item')} onClick={() => handleScrollIntoView('home-welcome')}>
                        Home
                    </Link>
                    <Link to="#" className={cx('header__nav-item')} onClick={() => handleScrollIntoView('home-app')}>
                        App
                    </Link>
                    <Link to="#" className={cx('header__nav-item')} onClick={() => toast.info('This feature is currently under development.')}>
                        SOAI
                    </Link>
                </nav>
            </header>

            <Outlet />

            <Footer />
        </>
    );
};

export default Layout;
