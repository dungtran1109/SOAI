import React from "react";
import AdminSidebar from "./AdminSidebar";
import "../../css/AdminDashboard.css";

const AdminLayout = ({ children }) => {
    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="admin-dashboard__content">
                {children}
            </div>
        </div>
    );
};

export default AdminLayout;
