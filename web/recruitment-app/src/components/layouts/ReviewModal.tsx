import React from 'react';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/layouts/modal.module.scss';

const cx = classNames.bind(styles);

interface ConfirmModalProps {
    title?: string;
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: number;
}

const ReviewModal = ({ title, open, children, onClose, width = 900 }: ConfirmModalProps) => {
    if (!open) return null;

    return (
        <div className={cx('modal-overlay')} onClick={onClose}>
            <div className={cx('modal')} onClick={(e) => e.stopPropagation()} style={{ width: `${width}px` }}>
                <div className={cx('modal__header')}>
                    <h2>{title}</h2>
                    <button className={cx('modal__header-close-btn')} onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className={cx('modal__body')}>{children}</div>
            </div>
        </div>
    );
};

export default ReviewModal;
