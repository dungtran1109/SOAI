import AdminLayout from '../components/admins/AdminLayout';
import AdminUserList from '../components/admins/AdminAccountList';

const AdminAccountPage = () => {
    return (
        <AdminLayout>
            <AdminUserList />
        </AdminLayout>
    );
};

export default AdminAccountPage;
