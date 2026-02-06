import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { gatewayAPI, walletAPI } from '../../services/api';
import './TransactionPages.css';

const Payin = () => {
    const [amount, setAmount] = useState('');
    const [fromAccount, setFromAccount] = useState('EXTERNAL_BANK');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const { wallet } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            const response = await gatewayAPI.payin({
                amount: parseFloat(amount),
                fromAccount
            });

            const data = response.data.data;
            setMessage({
                type: data.status === 'SUCCESS' ? 'success' : 'error',
                text: data.status === 'SUCCESS'
                    ? `Successfully added ${amount} to your wallet!`
                    : 'Transaction failed. Please try again.'
            });

            if (data.status === 'SUCCESS') {
                setTimeout(() => navigate('/dashboard'), 2000);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to process pay-in'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="transaction-container">
            <h1 className="page-title">Add Money (Pay-in)</h1>

            <div className="transaction-card">
                <div className="card-icon">💰</div>

                <p className="card-description">
                    Add money to your wallet from your bank account
                </p>

                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="transaction-form">
                    <div className="form-group">
                        <label>Amount (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            max="100000"
                            required
                            placeholder="Enter amount"
                        />
                        <small>Min: ₹1  |  Max: ₹100,000</small>
                    </div>

                    <div className="form-group">
                        <label>From Account</label>
                        <select
                            value={fromAccount}
                            onChange={(e) => setFromAccount(e.target.value)}
                        >
                            <option value="EXTERNAL_BANK">External Bank Account</option>
                            <option value="DEBIT_CARD">Debit Card</option>
                            <option value="UPI">UPI</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Add Money'}
                    </button>
                </form>

                <div className="info-box">
                    <strong>Note:</strong> This is a simulated transaction. Processing takes ~2 seconds.
                </div>
            </div>
        </div>
    );
};

export default Payin;
