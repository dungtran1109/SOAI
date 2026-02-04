import { Col, Container, Row } from '../components/responsives';
import classNames from 'classnames/bind';
import styles from '../assets/styles/suppliers/homePage.module.scss';
import abc from '../assets/images/abc.png';
import HomeApp from '../components/suppliers/HomeApp';

const cx = classNames.bind(styles);

const HomePage = () => {
    return (
        <div id="home-welcome" className={cx('home')}>
            <Row className={cx('home-introduce')}>
                <Col size={{ lg: 7, xl: 8 }}>
                    <div className={cx('welcome')}>
                        <div className={cx('welcome-textbox')}>
                            <p className={cx('welcome-textbox__subtitle')}>Good day 👋 everyone.</p>
                            <p className={cx('welcome-textbox__title')}>Welcome to SOAI system.</p>
                            <p className={cx('welcome-textbox__subtitle', 'welcome-textbox__subtitle--description')}>
                                The central place to access connected applications.
                            </p>
                        </div>

                        <section className={cx('welcome-control')}>
                            <button className={cx('welcome-control__btn', 'welcome-control__btn--explore')}>Explore</button>
                            <button className={cx('welcome-control__btn', 'welcome-control__btn--contact')}>Contact Us</button>
                        </section>
                    </div>
                </Col>
                <Col size={{ xs: 0, sm: 0, md: 0, lg: 5, xl: 4 }}>
                    <div>
                        <img src={abc} alt="abc" width={360} />
                    </div>
                </Col>
            </Row>

            <Container className={cx('home__app')}>
                <HomeApp />
            </Container>
        </div>
    );
};

export default HomePage;
