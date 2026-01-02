import { Link } from 'react-router-dom';
import { Col, Container, Row } from '../layouts';
import { FiFacebook, FiMail, FiPhone } from 'react-icons/fi';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/users/userFooter.module.scss';
import logo from '../../assets/images/logo.png';

const cx = classNames.bind(styles);

const UserFooter = () => {
    return (
        <div className={cx('footer-frame')}>
            <p className={cx('separate-line')}></p>
            <footer className={cx('footer')}>
                <Container>
                    <Row space={10}>
                        <Col size={{ xs: 0, sm: 0, md: 6, lg: 3, xl: 3 }} className={cx('footer-col')}>
                            <div className={cx('footer-col__content', 'footer-col__content--logo-center')}>
                                <img src={logo} alt="Logo" width={100} />
                                <h2 className={cx('footer-col__content-title')}>Smart Recruiter</h2>
                            </div>
                        </Col>
                        <Col size={{ xs: 12, sm: 12, md: 6, lg: 3, xl: 3 }} className={cx('footer-col')}>
                            <div className={cx('footer-col__content')}>
                                <h2 className={cx('footer-col__content-title')}>About Us</h2>
                                <ul className={cx('footer-col__content-list')}>
                                    <li className={cx('footer-col__content-list-item')}>
                                        <Link to="#">Home</Link>
                                    </li>
                                    <li className={cx('footer-col__content-list-item')}>
                                        <Link to="#">About Us</Link>
                                    </li>
                                    <li className={cx('footer-col__content-list-item')}>
                                        <Link to="#">AI match service</Link>
                                    </li>
                                    <li className={cx('footer-col__content-list-item')}>
                                        <Link to="# ">All Jobs</Link>
                                    </li>
                                    <li className={cx('footer-col__content-list-item')}>
                                        <Link to="#">FAQ</Link>
                                    </li>
                                </ul>
                            </div>
                        </Col>
                        <Col size={{ xs: 12, sm: 12, md: 6, lg: 3, xl: 3 }} className={cx('footer-col')}>
                            <div className={cx('footer-col__content')}>
                                <h2 className={cx('footer-col__content-title')}>Terms & Conditions</h2>
                                <ul className={cx('footer-col__content-list')}>
                                    <li className={cx('footer-col__content-list-item')}>
                                        <Link to="#">Privacy Policy</Link>
                                    </li>
                                    <li className={cx('footer-col__content-list-item')}>
                                        <Link to="#">Operating Regulation</Link>
                                    </li>
                                    <li className={cx('footer-col__content-list-item')}>
                                        <Link to="#">Terms & Conditions</Link>
                                    </li>
                                </ul>
                            </div>
                        </Col>
                        <Col size={{ xs: 12, sm: 12, md: 6, lg: 3, xl: 3 }} className={cx('footer-col')}>
                            <div className={cx('footer-col__content')}>
                                <h2 className={cx('footer-col__content-title')}>Want to post a job? Contact us at</h2>
                                <ul className={cx('footer-col__content-list')}>
                                    <li className={cx('footer-col__content-list-item')}>
                                        <FiPhone style={{ marginRight: '10px' }} />
                                        <a href={`tel:0243999832`}>(+84) 243 999 832</a>
                                    </li>
                                    <li className={cx('footer-col__content-list-item')}>
                                        <FiMail style={{ marginRight: '10px' }} />
                                        <a href={`mailto:smart.recruit.ai@gmail.com`}>smart.recruit.ai@gmail.com</a>
                                    </li>
                                    <li className={cx('footer-col__content-list-item')}>
                                        <FiFacebook style={{ marginRight: '10px' }} />
                                        <a href="#">Smart Recruiter</a>
                                    </li>
                                </ul>
                            </div>
                        </Col>
                    </Row>
                </Container>

                <p className={cx('footer__divider')} />

                <p className={cx('footer__endline')}>2025 💖 Smart Recruiter for Company</p>
            </footer>
        </div>
    );
};

export default UserFooter;
