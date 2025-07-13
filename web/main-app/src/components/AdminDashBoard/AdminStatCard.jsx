import React from "react";
import "../../css/AdminStatCard.css";

const AdminStatCard = ({ label, count, icon, indicator }) => {
    return (
        <div className="admin-stat-card">
            <div className="admin-stat-card__header">
                <div className="admin-stat-card__icon">
                    <img src={icon} alt={label} />
                </div>
                {indicator && (
                    <div className={`admin-stat-card__indicator ${indicator.type === "up" ? "up" : "down"}`}>
                        {indicator.type === "up" ? "▲" : "▼"} {indicator.value}
                    </div>
                )}
            </div>
            <div className="admin-stat-card__count">{count}</div>
            <div className="admin-stat-card__label">{label}</div>
        </div>
    );
};

export default AdminStatCard;
