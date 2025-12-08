import React from 'react';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/layouts/modal.module.scss';

const cx = classNames.bind(styles);

interface ConfirmModalProps {
    open: boolean;
    onOk: () => void;
    onCancel: () => void;
    children: React.ReactNode;
    title?: string;
    cancelBtnName?: string;
    okBtnName?: string;
    width?: number;
}

const ConfirmModal = ({ title, open, children, onOk, onCancel, cancelBtnName = 'Cancel', okBtnName = 'OK', width = 900 }: ConfirmModalProps) => {
    if (!open) return null;

    return (
        <div className={cx('modal-overlay')} onClick={onCancel}>
            <div className={cx('modal')} onClick={(e) => e.stopPropagation()} style={{ width: `${width}px` }}>
                <div className={cx('modal__header')}>
                    <h2>{title}</h2>
                    <button className={cx('modal__header-close-btn')} onClick={onCancel}>
                        ×
                    </button>
                </div>

                <div className={cx('modal__body')}>{children}</div>

                <div className={cx('modal__footer')}>
                    <button className={cx('modal__footer-btn', 'modal__footer-btn--ok')} onClick={onOk}>
                        {okBtnName}
                    </button>
                    <button className={cx('modal__footer-btn', 'modal__footer-btn--cancel')} onClick={onCancel}>
                        {cancelBtnName}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
