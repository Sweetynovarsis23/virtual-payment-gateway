import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency, formatDateTime, getStatusColor, getTransactionTypeLabel } from '../../utils/formatters';
import '../user/UserDashboard.css';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ type: '', status: '' });

    useEffect(() => {
        fetchTransactions();
    }, [filter]);

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filter.type) params.append('type', filter.type);
            if (filter.status) params.append('status', filter.status);

            const response = await axios.get(
                `http://localhost:5000/api/admin/transactions?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTransactions(response.data.data.transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading transactions...</div>;
    }

    return (
        <div className="dashboard-container">
            <h1 className="page-title">📋 All Transactions</h1>

            <div className="card transactions-card">
                <div className="filter-bar">
                    <div>
                        <label>Type:</label>
                        <select
                            value={filter.type}
                            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        >
                            <option value="">All Types</option>
                            <option value="PAYIN">Pay-in</option>
                            <option value="PAYOUT">Payout</option>
                            <option value="TAX">Tax Payment</option>
                        </select>
                    </div>
                    <div>
                        <label>Status:</label>
                        <select
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="SUCCESS">Success</option>
                            <option value="FAILED">Failed</option>
                            <option value="PENDING">Pending</option>
                        </select>
                    </div>
                </div>

                <div className="transactions-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>User</th>
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
                                    <td>{txn.userEmail || 'N/A'}</td>
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
                </div>

                <div className="transaction-summary">
                    Showing {transactions.length} transactions
                </div>
            </div>
        </div>
    );
};

export default Transactions;
