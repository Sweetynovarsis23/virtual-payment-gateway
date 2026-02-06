import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { gatewayAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import './TransactionPages.css';

const Payout = () => {
    const [amount, setAmount] = useState('');
    const [toAccount, setToAccount] = useState('BANK_ACCOUNT');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const { wallet } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (parseFloat(amount) > wallet?.balance) {
            setMessage({
                type: 'error',
                text: 'Insufficient balance'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await gatewayAPI.payout({
                amount: parseFloat(amount),
                toAccount
            });

            const data = response.data.data;
            setMessage({
                type: data.status === 'SUCCESS' ? 'success' : 'error',
                text: data.status === 'SUCCESS'
                    ? `Successfully sent ${amount} from your wallet!`
                    : 'Transaction failed. Please try again.'
            });

            if (data.status === 'SUCCESS') {
                setTimeout(() => navigate('/dashboard'), 2000);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to process payout'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="transaction-container">
            <h1 className="page-title">Send Money (Payout)</h1>

            <div className="transaction-card">
                <div className="card-icon">💸</div>

                <p className="card-description">
                    Send money from your wallet to external account
                </p>

                <div className="balance-display">
                    <span>Available Balance:</span>
                    <strong>{formatCurrency(wallet?.balance || 0)}</strong>
                </div>

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
                            max={wallet?.balance || 100000}
                            required
                            placeholder="Enter amount"
                        />
                        <small>Available: {formatCurrency(wallet?.balance || 0)}</small>
                    </div>

                    <div className="form-group">
                        <label>To Account</label>
                        <select
                            value={toAccount}
                            onChange={(e) => setToAccount(e.target.value)}
                        >
                            <option value="BANK_ACCOUNT">Bank Account</option>
                            <option value="UPI">UPI</option>
                            <option value="WALLET">Other Wallet</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Send Money'}
                    </button>
                </form>

                <div className="info-box">
                    <strong>Note:</strong> This is a simulated transaction. Processing takes ~2 seconds.
                </div>
            </div>
        </div>
    );
};

export default Payout;
