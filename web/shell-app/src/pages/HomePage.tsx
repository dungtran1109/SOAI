import { Col, Container, Row } from '../components/responsives';
import classNames from 'classnames/bind';
import styles from '../assets/styles/suppliers/homePage.module.scss';
import tower from '../assets/images/tower.png';
import HomeApp from '../components/suppliers/HomeApp';
import { FiArrowRight } from 'react-icons/fi';
import { handleScrollIntoView } from '../shared/helpers/commonUtils';
import { toast } from 'react-toastify';

const cx = classNames.bind(styles);

const HomePage = () => {
    return (
        <div id="home-welcome" className={cx('home')}>
            <Row className={cx('home__intro')}>
                <Col size={{ lg: 7, xl: 8 }}>
                    <div className={cx('welcome')}>
                        <div className={cx('welcome-textbox')}>
                            <p className={cx('welcome-textbox__title')}>SOAI Integrations</p>
                            <p className={cx('welcome-textbox__subtitle')}>
                                Good day 👋 everyone. Welcome to the central place where accesses connected applications.
                            </p>
                        </div>

                        <section className={cx('welcome-control')}>
                            <button
                                className={cx('welcome-control__btn', 'welcome-control__btn--contact')}
                                onClick={() => toast.info('This feature is currently under development.')}
                            >
                                SOAI Assistant
                            </button>
                            <button className={cx('welcome-control__btn', 'welcome-control__btn--explore')} onClick={() => handleScrollIntoView('home-app')}>
                                Explore <FiArrowRight />
                            </button>
                        </section>
                    </div>
                </Col>
                <Col size={{ xs: 0, sm: 0, md: 0, lg: 5, xl: 4 }}>
                    <img src={tower} alt="tower" width={360} className={cx('ai-image')} />
                </Col>
            </Row>

            <Container className={cx('home__app')}>
                <HomeApp />
            </Container>
        </div>
    );
};

export default HomePage;
