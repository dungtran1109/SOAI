import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { toast } from 'react-toastify';
import { APP_TYPES, APPS, type AppType } from '../../shared/contants/common';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/suppliers/homeApp.module.scss';

const cx = classNames.bind(styles);

export interface InView {
    ref: (node?: Element | null) => void;
    inView: boolean;
}

const HomeApp = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState<string>('');
    const [filter, setFilter] = useState<AppType>('ALL');
    const { ref, inView }: InView = useInView({ threshold: 0.8, triggerOnce: true, initialInView: false });

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return APPS.filter((app) => {
            const matchQuery = !query || app.name.toLowerCase().includes(query) || app.description.toLowerCase().includes(query);
            const matchFilter = filter === 'ALL' || app.type === filter;
            return matchQuery && matchFilter;
        });
    }, [search, filter]);

    return (
        <section id="home-app">
            <div className={cx('app-header')}>
                <p className={cx('app-header__subtitle')}>Manage connections and quickly jump into our tools.</p>
            </div>

            <div className={cx('app-control')}>
                <input
                    className={cx('search')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search apps…"
                    aria-label="Search apps"
                />

                <div className={cx('filter')} role="tablist" aria-label="Filter by status">
                    {APP_TYPES.map((type) => (
                        <button
                            key={type}
                            type="button"
                            className={cx('filter__type', { 'filter__type--active': filter === type })}
                            onClick={() => setFilter(type)}
                            role="tab"
                            aria-selected={filter === type}
                        >
                            {type.toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div ref={ref} className={cx('app-wrapper')}>
                {inView &&
                    filtered.map((app, index) => {
                        return (
                            <article
                                key={app.id}
                                className={cx('app-wrapper__card', `app-wrapper__card--${app.type.toLowerCase()}`)}
                                style={{ animationDelay: `${index * 140}ms` }}
                            >
                                <h3 className={cx('app-wrapper__card-title')}>{app.name}</h3>
                                <p className={cx('app-wrapper__card-description')}>{app.description}</p>

                                <div className={cx('app-wrapper__card-action')}>
                                    <button
                                        type="button"
                                        className={cx('app-wrapper__card-action-btn', 'app-wrapper__card-action-btn--primary')}
                                        onClick={() => navigate(app.path)}
                                    >
                                        Open
                                    </button>

                                    <button
                                        type="button"
                                        className={cx('app-wrapper__card-action-btn', 'app-wrapper__card-action-btn--ghost')}
                                        onClick={() => toast.info('This feature is currently under development.')}
                                    >
                                        Details
                                    </button>
                                </div>
                            </article>
                        );
                    })}
            </div>

            {filtered.length === 0 && (
                <div className={cx('empty')}>
                    <p>Oops! No apps found 👀</p>
                </div>
            )}
        </section>
    );
};

export default HomeApp;
