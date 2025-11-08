import { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from '../../assets/styles/admins/adminUserList.module.scss';
import frameStyles from '../../assets/styles/admins/adminFrame.module.scss';
import { deleteAccount, getAccounts } from '../../shared/apis/authApis';
import type { Account } from '../../shared/types/adminTypes';
import { FiTrash2 } from 'react-icons/fi';
import { Badge } from '../layouts';
import { MdAdminPanelSettings } from 'react-icons/md';
import { HiUser } from 'react-icons/hi';
import { FaUserCircle } from 'react-icons/fa';

const cx = classNames.bind({ ...frameStyles, ...styles });

type ColumnName = 'User Info' | 'Role' | 'Date Joined' | 'Contact' | 'Action';

interface AdminUserListProps {
    disableColumns?: ColumnName[];
}

const AdminUserList = ({ disableColumns = [] }: AdminUserListProps) => {
    const [accounts, setAccounts] = useState<Account[]>([]);

    const fetchAllAccounts = useCallback(async () => {
        try {
            const result = await getAccounts();
            setAccounts(result || []);
        } catch (err) {
            console.error('Failed to fetch accounts:', err);
        }
    }, []);

    useEffect(() => {
        fetchAllAccounts();
    }, [fetchAllAccounts]);

    const handleDeleteAccount = async (account: Account): Promise<void> => {
        if (window.confirm(`Are you sure you want to delete the account - ${account.userName}?`)) {
            try {
                await deleteAccount(account.accId);
                fetchAllAccounts();
            } catch (err) {
                console.error('Failed to delete account:', err);
            }
        }
    };

    return (
        <div className={cx('admin-frame')}>
            <div className={cx('admin-frame-header')}>
                <h2 className={cx('admin-frame-header__title')}>Account Management</h2>
                <p className={cx('admin-frame-header__subtitle')}>Manage all user accounts.</p>
            </div>

            <table className={cx('admin-table')}>
                <thead>
                    <tr>
                        {!disableColumns.includes('User Info') && <th className={cx('admin-table__column-title')}>User Info</th>}
                        {!disableColumns.includes('Role') && <th className={cx('admin-table__column-title')}>Role</th>}
                        {!disableColumns.includes('Contact') && <th className={cx('admin-table__column-title')}>Contact</th>}
                        {!disableColumns.includes('Date Joined') && <th className={cx('admin-table__column-title')}>Date Joined</th>}
                        {!disableColumns.includes('Action') && <th className={cx('admin-table__column-title')}>Action</th>}
                    </tr>
                </thead>
                <tbody>
                    {accounts.map((account) => (
                        <tr key={account.accId}>
                            {!disableColumns.includes('User Info') && (
                                <td className={cx('admin-table__column-value')}>
                                    <div className={cx('user')}>
                                        <FaUserCircle size={36} className={cx('user__avatar')} />
                                        <div className={cx('user__info')}>
                                            <div className={cx('user__info-name')}>{account.userName}</div>
                                            <div className={cx('user__info-id')}>ID: {account.accId}</div>
                                        </div>
                                    </div>
                                </td>
                            )}
                            {!disableColumns.includes('Role') && (
                                <td className={cx('admin-table__column-value')}>
                                    <Badge
                                        className={cx('role-badge', `role-badge-${account.role.toLowerCase()}`)}
                                        label={
                                            <>
                                                {account.role === 'ADMIN' ? (
                                                    <MdAdminPanelSettings className={cx('role-badge-icon')} />
                                                ) : (
                                                    <HiUser className={cx('role-badge-icon')} />
                                                )}
                                                {account.role}
                                            </>
                                        }
                                    />
                                </td>
                            )}
                            {!disableColumns.includes('Contact') && <td className={cx('admin-table__column-value')}>{account.phoneNumber}</td>}
                            {!disableColumns.includes('Date Joined') && (
                                <td className={cx('admin-table__column-value')}>{new Date(account.createAt).toLocaleDateString()}</td>
                            )}
                            {!disableColumns.includes('Action') && (
                                <td className={cx('admin-table__column-value')}>
                                    <div className={cx('admin-table__action')}>
                                        <button
                                            className={cx('admin-table__action-btn', 'admin-table__action-btn--delete')}
                                            onClick={() => handleDeleteAccount(account)}
                                            title="Delete"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUserList;
