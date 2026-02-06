import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { formatCurrency } from '../../utils/formatters';
import {
    FaShieldAlt,
    FaUsers,
    FaMoneyBillWave,
    FaPaperPlane,
    FaLandmark,
    FaClock,
    FaChartBar,
    FaClipboardList,
    FaUniversity
} from 'react-icons/fa';
import '../user/UserDashboard.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        fetchStats();
    }, [user, navigate]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading admin dashboard...</div>;
    }

    if (!stats) {
        return <div className="loading">Failed to load statistics</div>;
    }

    return (
        <div className="dashboard-container">
            <h1 className="page-title"><FaShieldAlt /> Admin Dashboard</h1>

            <div className="admin-stats-grid">
                {/* Total Users */}
                <div className="stat-card stat-blue">
                    <div className="stat-icon"><FaUsers /></div>
                    <div className="stat-content">
                        <div className="stat-label">Total Users</div>
                        <div className="stat-value">{stats.totalUsers}</div>
                    </div>
                </div>

                {/* Total Pay-in */}
                <div className="stat-card stat-green">
                    <div className="stat-icon"><FaMoneyBillWave /></div>
                    <div className="stat-content">
                        <div className="stat-label">Total Pay-in</div>
                        <div className="stat-value">{formatCurrency(stats.totalPayin)}</div>
                    </div>
                </div>

                {/* Total Payout */}
                <div className="stat-card stat-orange">
                    <div className="stat-icon"><FaPaperPlane /></div>
                    <div className="stat-content">
                        <div className="stat-label">Total Payout</div>
                        <div className="stat-value">{formatCurrency(stats.totalPayout)}</div>
                    </div>
                </div>

                {/* Treasury Balance */}
                <div className="stat-card stat-purple">
                    <div className="stat-icon"><FaLandmark /></div>
                    <div className="stat-content">
                        <div className="stat-label">Treasury Balance</div>
                        <div className="stat-value">{formatCurrency(stats.treasuryBalance)}</div>
                    </div>
                </div>

                {/* Pending Transactions */}
                <div className="stat-card stat-yellow">
                    <div className="stat-icon"><FaClock /></div>
                    <div className="stat-content">
                        <div className="stat-label">Pending Transactions</div>
                        <div className="stat-value">{stats.pendingTransactions}</div>
                    </div>
                </div>

                {/* Total Tax Collected */}
                <div className="stat-card stat-red">
                    <div className="stat-icon"><FaChartBar /></div>
                    <div className="stat-content">
                        <div className="stat-label">Total Tax Collected</div>
                        <div className="stat-value">{formatCurrency(stats.totalTaxCollected)}</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="admin-quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                    <button onClick={() => navigate('/admin/users')} className="action-btn">
                        <FaUsers /> Manage Users
                    </button>
                    <button onClick={() => navigate('/admin/transactions')} className="action-btn">
                        <FaClipboardList /> View Transactions
                    </button>
                    <button onClick={() => navigate('/admin/treasury')} className="action-btn">
                        <FaUniversity /> Treasury Details
                    </button>
                    <button onClick={() => navigate('/admin/audit-logs')} className="action-btn">
                        <FaClipboardList /> Audit Logs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
