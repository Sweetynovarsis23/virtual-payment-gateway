import { useState, useEffect } from 'react';
import { walletAPI } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor, getTransactionTypeLabel } from '../../utils/formatters';
import '../user/UserDashboard.css';

const History = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await walletAPI.getHistory(100);
            setTransactions(response.data.data.transactions);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = filter === 'ALL'
        ? transactions
        : transactions.filter(t => t.type === filter);

    if (loading) {
        return <div className="loading">Loading transactions...</div>;
    }

    return (
        <div className="dashboard-container">
            <h1 className="page-title">Transaction History</h1>

            <div className="card transactions-card">
                <div className="filter-bar">
                    <label>Filter by type:</label>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="ALL">All Transactions</option>
                        <option value="PAYIN">Pay-in Only</option>
                        <option value="PAYOUT">Payout Only</option>
                        <option value="TAX">Tax Payments Only</option>
                    </select>
                </div>

                <div className="transactions-table">
                    {filteredTransactions.length === 0 ? (
                        <div className="empty-state">
                            <p>No transactions found</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((txn) => (
                                    <tr key={txn.txnId}>
                                        <td className="txn-id">{txn.txnId}</td>
                                        <td>{getTransactionTypeLabel(txn.type)}</td>
                                        <td className={txn.type === 'PAYIN' ? 'amount-positive' : 'amount-negative'}>
                                            {txn.type === 'PAYIN' ? '+' : '-'}{formatCurrency(txn.amount)}
                                        </td>
                                        <td>{txn.fromAccount || '-'}</td>
                                        <td>{txn.toAccount || '-'}</td>
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

                <div className="transaction-summary">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
            </div>
        </div>
    );
};

export default History;
