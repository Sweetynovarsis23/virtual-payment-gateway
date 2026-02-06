import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { walletAPI, gatewayAPI } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor, getTransactionTypeLabel } from '../../utils/formatters';
import { FaWallet, FaChartBar, FaHistory } from 'react-icons/fa';
import './UserDashboard.css';

const UserDashboard = () => {
    const { wallet } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [virtualAccount, setVirtualAccount] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [historyRes, accountRes] = await Promise.all([
                walletAPI.getHistory(10),
                walletAPI.getVirtualAccount()
            ]);
            setTransactions(historyRes.data.data.transactions);
            setVirtualAccount(accountRes.data.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <h1 className="page-title">Dashboard</h1>

            <div className="dashboard-grid">
                {/* Wallet Balance Card */}
                <div className="card balance-card">
                    <div className="card-header">
                        <FaWallet className="card-icon" />
                        <h3>Wallet Balance</h3>
                    </div>
                    <div className="balance-amount">
                        {formatCurrency(wallet?.balance || 0)}
                    </div>
                    <div className="virtual-account">
                        <span className="label">Virtual Account:</span>
                        <span className="value">{virtualAccount?.virtualAccountNo || 'N/A'}</span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="card stats-card">
                    <div className="card-header">
                        <FaChartBar className="card-icon" />
                        <h3>Quick Stats</h3>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value">{transactions.length}</div>
                            <div className="stat-label">Total Transactions</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">
                                {transactions.filter(t => t.status === 'SUCCESS').length}
                            </div>
                            <div className="stat-label">Successful</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="card transactions-card">
                <div className="card-header">
                    <FaHistory className="card-icon" />
                    <h3>Recent Transactions</h3>
                </div>
                <div className="transactions-table">
                    {transactions.length === 0 ? (
                        <div className="empty-state">
                            <p>No transactions yet</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((txn) => (
                                    <tr key={txn.txnId}>
                                        <td className="txn-id">{txn.txnId}</td>
                                        <td>{getTransactionTypeLabel(txn.type)}</td>
                                        <td className={txn.type === 'PAYIN' ? 'amount-positive' : 'amount-negative'}>
                                            {txn.type === 'PAYIN' ? '+' : '-'}{formatCurrency(txn.amount)}
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${getStatusColor(txn.status)}`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td>{formatDateTime(txn.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
