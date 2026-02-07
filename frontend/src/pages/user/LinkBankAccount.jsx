import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUniversity, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import './LinkBankAccount.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LinkBankAccount = () => {
    const [formData, setFormData] = useState({
        accountNumber: '',
        confirmAccountNumber: '',
        ifsc: '',
        accountHolderName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (formData.accountNumber !== formData.confirmAccountNumber) {
            setError('Account numbers do not match');
            return;
        }

        if (formData.ifsc.length !== 11) {
            setError('IFSC code must be 11 characters');
            return;
        }

        if (!formData.accountHolderName.trim()) {
            setError('Account holder name is required');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.post(
                `${API_BASE_URL}/bank-accounts/link`,
                {
                    accountNumber: formData.accountNumber,
                    ifsc: formData.ifsc.toUpperCase(),
                    accountHolderName: formData.accountHolderName
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setSuccess('Bank account linked successfully!');
                setTimeout(() => {
                    navigate('/bank-accounts');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to link bank account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="link-bank-account-container">
            <div className="link-bank-card">
                <div className="card-header">
                    <h1>
                        <FaUniversity /> Link Bank Account
                    </h1>
                    <p>Connect your bank account for seamless transactions</p>
                </div>

                <div className="info-box">
                    <FaInfoCircle />
                    <div>
                        <strong>Secure Verification</strong>
                        <p>Your bank account will be verified through a secure penny-drop process. This ensures the account belongs to you.</p>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit} className="link-bank-form">
                    <div className="form-group">
                        <label htmlFor="accountHolderName">Account Holder Name *</label>
                        <input
                            type="text"
                            id="accountHolderName"
                            name="accountHolderName"
                            value={formData.accountHolderName}
                            onChange={handleChange}
                            placeholder="As per bank records"
                            required
                        />
                        <small>Enter name exactly as shown on your bank statement</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="accountNumber">Account Number *</label>
                        <input
                            type="text"
                            id="accountNumber"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleChange}
                            placeholder="Enter your account number"
                            required
                            pattern="[0-9]+"
                            title="Only numbers allowed"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmAccountNumber">Confirm Account Number *</label>
                        <input
                            type="text"
                            id="confirmAccountNumber"
                            name="confirmAccountNumber"
                            value={formData.confirmAccountNumber}
                            onChange={handleChange}
                            placeholder="Re-enter your account number"
                            required
                            pattern="[0-9]+"
                            title="Only numbers allowed"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="ifsc">IFSC Code *</label>
                        <input
                            type="text"
                            id="ifsc"
                            name="ifsc"
                            value={formData.ifsc}
                            onChange={handleChange}
                            placeholder="e.g., SBIN0001234"
                            required
                            maxLength="11"
                            style={{ textTransform: 'uppercase' }}
                        />
                        <small>11-character IFSC code of your bank branch</small>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate('/bank-accounts')}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Linking Account...' : 'Link Account'}
                        </button>
                    </div>
                </form>

                <div className="security-note">
                    <FaInfoCircle />
                    <p>
                        <strong>Security:</strong> Your bank account details are encrypted and securely stored.
                        We never store your banking passwords or PINs.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LinkBankAccount;
