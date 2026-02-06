import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import '../user/UserDashboard.css';

const Treasury = () => {
    const [treasury, setTreasury] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTreasury();
    }, []);

    const fetchTreasury = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/treasury', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTreasury(response.data.data.treasury);
            setTransactions(response.data.data.recentTransactions);
        } catch (error) {
            console.error('Error fetching treasury:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading treasury data...</div>;
    }

    return (
        <div className="dashboard-container">
            <h1 className="page-title">🏛️ Government Treasury</h1>

            {/* Treasury Overview */}
            <div className="dashboard-grid">
                <div className="card balance-card">
                    <div className="card-header">
                        <span className="card-icon">💰</span>
                        <h3>Current Balance</h3>
                    </div>
                    <div className="balance-amount">
                        {formatCurrency(treasury?.balance || 0)}
                    </div>
                </div>

                <div className="card stats-card">
                    <div className="card-header">
                        <span className="card-icon">📊</span>
                        <h3>Total Collected</h3>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value" style={{ color: '#059669' }}>
                                {formatCurrency(treasury?.totalCollected || 0)}
                            </div>
                            <div className="stat-label">All-Time Tax Collection</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Tax Payments */}
            <div className="card transactions-card">
                <div className="card-header">
                    <span className="card-icon">📜</span>
                    <h3>Recent Tax Payments</h3>
                </div>

                <div className="transactions-table">
                    {transactions.length === 0 ? (
                        <div className="empty-state">
                            <p>No tax payments yet</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>User Email</th>
                                    <th>Amount</th>
                                    <th>Receipt ID</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((txn) => (
                                    <tr key={txn.txnId}>
                                        <td className="txn-id">{txn.txnId}</td>
                                        <td>{txn.userEmail}</td>
                                        <td className="amount-positive">
                                            {formatCurrency(txn.amount)}
                                        </td>
                                        <td className="txn-id">{txn.receiptId || 'N/A'}</td>
                                        <td>{formatDateTime(txn.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="transaction-summary">
                    Showing {transactions.length} recent tax payments
                </div>
            </div>
        </div>
    );
};

export default Treasury;
