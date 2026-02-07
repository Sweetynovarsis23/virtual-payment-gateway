import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUniversity, FaPlus, FaCheckCircle, FaClock, FaTimesCircle, FaStar, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import './BankAccounts.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BankAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchBankAccounts();
    }, []);

    const fetchBankAccounts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/bank-accounts`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setAccounts(response.data.data.accounts);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load bank accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAccount = async (id) => {
        if (!confirm('Are you sure you want to remove this bank account?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${API_BASE_URL}/bank-accounts/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                alert('Bank account removed successfully');
                fetchBankAccounts();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove bank account');
        }
    };

    const handleSetPrimary = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(`${API_BASE_URL}/bank-accounts/${id}/primary`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                alert('Primary account updated');
                fetchBankAccounts();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update primary account');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <FaCheckCircle className="status-icon verified" />;
            case 'pending':
                return <FaClock className="status-icon pending" />;
            case 'failed':
                return <FaTimesCircle className="status-icon failed" />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="bank-accounts-container">
                <div className="loading">Loading bank accounts...</div>
            </div>
        );
    }

    return (
        <div className="bank-accounts-container">
            <div className="page-header">
                <h1 className="page-title">
                    <FaUniversity /> My Bank Accounts
                </h1>
                <button
                    className="btn-primary"
                    onClick={() => navigate('/link-bank-account')}
                >
                    <FaPlus /> Link New Account
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {accounts.length === 0 ? (
                <div className="empty-state">
                    <FaUniversity className="empty-icon" />
                    <h2>No Bank Accounts Linked</h2>
                    <p>Link your bank account to enable faster transactions</p>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/link-bank-account')}
                    >
                        <FaPlus /> Link Your First Account
                    </button>
                </div>
            ) : (
                <div className="accounts-grid">
                    {accounts.map((account) => (
                        <div key={account.id} className="account-card">
                            <div className="account-header">
                                <div className="bank-info">
                                    <FaUniversity className="bank-icon" />
                                    <div>
                                        <h3>{account.bankName}</h3>
                                        <p className="account-holder">{account.accountHolderName}</p>
                                    </div>
                                </div>
                                {account.isPrimary && (
                                    <span className="primary-badge">
                                        <FaStar /> Primary
                                    </span>
                                )}
                            </div>

                            <div className="account-details">
                                <div className="detail-row">
                                    <span className="label">Account Number:</span>
                                    <span className="value">{account.accountNumber}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">IFSC Code:</span>
                                    <span className="value">{account.ifsc}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Verification Status:</span>
                                    <span className={`status ${account.verificationStatus}`}>
                                        {getStatusIcon(account.verificationStatus)}
                                        {account.verificationStatus}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Linked On:</span>
                                    <span className="value">
                                        {new Date(account.linkedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="account-actions">
                                {!account.isPrimary && (
                                    <button
                                        className="btn-secondary"
                                        onClick={() => handleSetPrimary(account.id)}
                                    >
                                        <FaStar /> Set as Primary
                                    </button>
                                )}
                                <button
                                    className="btn-danger"
                                    onClick={() => handleRemoveAccount(account.id)}
                                >
                                    <FaTrash /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BankAccounts;
