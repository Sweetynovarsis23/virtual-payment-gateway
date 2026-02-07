import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLandmark } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { gatewayAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import './TransactionPages.css';

const PayTax = () => {
    const [amount, setAmount] = useState('');
    const [taxType, setTaxType] = useState('GENERAL');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const { wallet, refreshWallet } = useAuth();
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
            const response = await gatewayAPI.payTax({
                amount: parseFloat(amount),
                taxType
            });

            const data = response.data.data;
            setMessage({
                type: data.status === 'SUCCESS' ? 'success' : 'error',
                text: data.status === 'SUCCESS'
                    ? `Tax payment of ₹${amount} successful! Receipt ID: ${data.receiptId}`
                    : 'Tax payment failed. Please try again.'
            });

            if (data.status === 'SUCCESS') {
                await refreshWallet(); // Refresh wallet balance
                setAmount('');
                setTaxType('GENERAL');
                setTimeout(() => navigate('/dashboard'), 2000);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to process tax payment'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="transaction-container">
            <h1 className="page-title">Pay Government Tax</h1>

            <div className="transaction-card">
                <div className="card-icon">
                    <FaLandmark size={48} color="#dc2626" />
                </div>

                <p className="card-description">
                    Pay tax directly to Government Treasury from your wallet
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
                        <label>Tax Type</label>
                        <select
                            value={taxType}
                            onChange={(e) => setTaxType(e.target.value)}
                        >
                            <option value="GENERAL">General Tax</option>
                            <option value="INCOME_TAX">Income Tax</option>
                            <option value="GST">GST</option>
                            <option value="PROPERTY_TAX">Property Tax</option>
                            <option value="PROFESSIONAL_TAX">Professional Tax</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Tax Amount (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            max={wallet?.balance || 100000}
                            required
                            placeholder="Enter tax amount"
                        />
                        <small>Available: {formatCurrency(wallet?.balance || 0)}</small>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Pay Tax'}
                    </button>
                </form>

                <div className="info-box treasury-note">
                    <strong>⚡ Government Treasury:</strong> This payment goes directly to the
                    government treasury account with enhanced security and instant receipt generation.
                </div>
            </div>
        </div>
    );
};

export default PayTax;
