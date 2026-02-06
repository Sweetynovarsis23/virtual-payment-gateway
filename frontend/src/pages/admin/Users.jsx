import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import '../user/UserDashboard.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading users...</div>;
    }

    return (
        <div className="dashboard-container">
            <h1 className="page-title">👥 User Management</h1>

            <div className="card transactions-card">
                <div className="card-header">
                    <span className="card-icon">📊</span>
                    <h3>All Users ({users.length})</h3>
                </div>

                <div className="transactions-table">
                    {users.length === 0 ? (
                        <div className="empty-state">
                            <p>No users found</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Virtual Account</th>
                                    <th>Balance</th>
                                    <th>Created Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.email}</td>
                                        <td className="txn-id">
                                            {user.wallet?.virtualAccountNo || 'N/A'}
                                        </td>
                                        <td className="amount-positive">
                                            {user.wallet ? formatCurrency(user.wallet.balance) : 'N/A'}
                                        </td>
                                        <td>{formatDateTime(user.createdAt)}</td>
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

export default Users;
