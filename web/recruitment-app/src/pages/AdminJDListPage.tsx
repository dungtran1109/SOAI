import React, { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { createJD, uploadJDFile } from '../shared/apis/jdApis';
import type { JD } from '../shared/types/adminTypes';
import AdminLayout from '../components/admins/AdminLayout';
import AdminJDList from '../components/admins/AdminJDList';
import classNames from 'classnames/bind';
import styles from '../assets/styles/admins/adminJDListPage.module.scss';
import AdminJDForm from '../components/admins/AdminJDForm';

const cx = classNames.bind(styles);

const AdminJDListPage = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [addCV, setAddCV] = useState<boolean>(false);

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
            setAddCV(false);
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
        <AdminLayout>
            <div className={cx('admin-jd-management')}>
                <section className={cx('add-jd')}>
                    <input type="file" accept="application/json" id="jd-upload-input" onChange={handleUploadJSONFile} />
                    <label htmlFor="jd-upload-input" className={cx('add-jd__btn', 'add-jd__btn--json')}>
                        Upload JSON
                    </label>
                    <button className={cx('add-jd__btn', 'add-jd__btn--ui')} onClick={() => setAddCV(true)}>
                        + Add JD
                    </button>
                </section>
            </div>
            {addCV ? <AdminJDForm onSubmit={handleAddJD} onCancel={() => setAddCV(false)} /> : <AdminJDList />}
        </AdminLayout>
    );
};

export default AdminJDListPage;
