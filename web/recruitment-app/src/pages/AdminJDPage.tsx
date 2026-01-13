import React, { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { createJD, uploadJDFile } from '../services/api/jdApi';
import type { JD } from '../shared/types/adminTypes';
import AdminJDList from '../components/admins/AdminJDList';
import classNames from 'classnames/bind';
import frameStyles from '../assets/styles/admins/adminFrame.module.scss';
import styles from '../assets/styles/admins/adminJDPage.module.scss';
import AdminJDForm from '../components/admins/AdminJDForm';

const cx = classNames.bind({ ...frameStyles, ...styles });

const AdminJDPage = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [isAddCV, setIsAddCV] = useState<boolean>(false);

    const handleUploadJSONFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            await uploadJDFile(file);
            toast.success('JD JSON file uploaded successfully.', {
                position: 'top-center',
                hideProgressBar: true,
            });
        } catch (err) {
            toast.warning(`Failed to upload JD JSON file: ${(err as Error).message}`, {
                position: 'top-center',
                hideProgressBar: true,
            });
        }
        setLoading(false);
    };

    const handleAddJD = useCallback(async (jd: JD): Promise<void> => {
        if (Object.keys(jd).length > 0) {
            await createJD(jd);
            setIsAddCV(false);
            toast.success('Saved', {
                position: 'top-center',
                hideProgressBar: true,
            });
        }
    }, []);

    if (loading) {
        return null;
    }

    return (
        <>
            <div className={cx('admin-jd-management')}>
                <section className={cx('add-jd')}>
                    <input type="file" accept="application/json" id="jd-upload-input" onChange={handleUploadJSONFile} />
                    <label htmlFor="jd-upload-input" className={cx('add-jd__btn', 'add-jd__btn--json')}>
                        Upload JSON
                    </label>
                    <button className={cx('add-jd__btn', 'add-jd__btn--ui')} onClick={() => setIsAddCV(true)}>
                        + Add JD
                    </button>
                </section>
            </div>

            {isAddCV ? (
                <div className={cx('admin-frame')}>
                    <div className={cx('admin-frame-header')}>
                        <h2 className={cx('admin-frame-header__title')}>+ Add Jobs</h2>
                        <p className={cx('admin-frame-header__subtitle')}>Post a new job opening to start hiring qualified candidates.</p>
                    </div>
                    <AdminJDForm onSubmit={handleAddJD} onCancel={() => setIsAddCV(false)} />
                </div>
            ) : (
                <AdminJDList />
            )}
        </>
    );
};

export default AdminJDPage;
