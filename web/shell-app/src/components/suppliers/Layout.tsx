import { Link, Outlet } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/suppliers/layout.module.scss';
import logo from '../../assets/images/logo.png';
import Footer from './Footer';
import { handleScrollIntoView } from '../../shared/helpers/commonUtils';

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
                    <Link to="#" className={cx('header__nav-item')} onClick={() => handleScrollIntoView('footer')}>
                        About Us
                    </Link>
                </nav>
            </header>

            <Outlet />

            <Footer />
        </>
    );
};

export default Layout;
