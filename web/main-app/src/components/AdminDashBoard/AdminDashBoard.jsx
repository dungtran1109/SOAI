import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminStatCard from "./AdminStatCard";
import AdminCVList from "./AdminCVList";
import AdminJDList from "./AdminJDList";
import AdminInterviewList from "./AdminInterviewList";
import AdminUserList from "./AdminUserList";
import "../../css/AdminDashboard.css";

import cvIcon from "../../assets/icons/file-text.png";
import userIcon from "../../assets/icons/user.png";
import jdIcon from "../../assets/icons/briefcase.png";

import { listCVsByPosition } from "../../api/cvApi";
import { getAllJD } from "../../api/jdApi";
import { getAllUsers } from "../../api/authApi";

const AdminDashBoard = () => {
    const [stats, setStats] = useState({ cvs: 0, users: 0, jds: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [cvs, users, jds] = await Promise.all([
                    listCVsByPosition(""),
                    getAllUsers(),
                    getAllJD()
                ]);
                setStats({ cvs: cvs.length, users: users.length, jds: jds.length });
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="admin-dashboard">
            <AdminSidebar />
            <div className="admin-dashboard__content">
                <h1 className="admin-dashboard__title">Welcome, Admin</h1>
                <p className="admin-dashboard__subtitle">
                    Monitor all candidate applications and interview tasks here.
                </p>

                {/* Stat Summary Cards */}
                <div className="admin-dashboard__stats">
                    <AdminStatCard label="Total CVs" count={stats.cvs} icon={cvIcon} />
                    <AdminStatCard label="Total Users" count={stats.users} icon={userIcon} />
                    <AdminStatCard label="Job Descriptions" count={stats.jds} icon={jdIcon} />
                </div>

                <div className="admin-dashboard__grid-2col">
                    <div className="admin-dashboard__left-col">
                        <AdminCVList actionsEnabled={false} />
                        <AdminInterviewList actionsEnabled={false}/>
                    </div>
                    <div className="admin-dashboard__right-col">
                        <AdminJDList actionsEnabled={false} />
                    </div>
                </div>

                <div className="admin-dashboard__user-section">
                    <AdminUserList />
                </div>
            </div>
        </div>
    );
};

export default AdminDashBoard;
