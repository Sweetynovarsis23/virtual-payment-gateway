import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMobileAlt } from 'react-icons/fa';
import { upiAPI } from '../../services/api';
import './LinkUPI.css';

const LinkUPI = () => {
    const [vpaAddress, setVpaAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const validateUPI = (vpa) => {
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
        return upiRegex.test(vpa);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        // Frontend validation
        if (!validateUPI(vpaAddress)) {
            setMessage({
                type: 'error',
                text: 'Invalid UPI ID format. Use format: username@provider'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await upiAPI.link({ vpaAddress });

            setMessage({
                type: 'success',
                text: response.data.message
            });

            // Redirect after success
            setTimeout(() => {
                navigate('/manage-upi');
            }, 2000);

        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to link UPI'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="link-upi-container">
            <h1 className="page-title">Link UPI ID</h1>

            <div className="link-upi-card">
                <div className="card-icon">
                    <FaMobileAlt size={48} color="#1e40af" />
                </div>
                <h2>Link New UPI ID</h2>
                <p className="card-description">
                    Link your UPI ID for seamless payments
                </p>

                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="link-upi-form">
                    <div className="form-group">
                        <label>UPI ID (VPA)</label>
                        <input
                            type="text"
                            value={vpaAddress}
                            onChange={(e) => setVpaAddress(e.target.value.toLowerCase())}
                            placeholder="yourname@paytm"
                            required
                        />
                        <small>Example: john@paytm, user@googlepay, name@phonepe</small>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Linking...' : 'Link UPI'}
                    </button>
                </form>

                <div className="info-box">
                    <strong>📱 Supported UPI Apps:</strong>
                    <ul>
                        <li>Google Pay (@okaxis, @okhdfcbank, @okicici)</li>
                        <li>PhonePe (@ybl, @ibl, @axl)</li>
                        <li>Paytm (@paytm)</li>
                        <li>Amazon Pay (@apl)</li>
                        <li>And all other UPI apps</li>
                    </ul>
                </div>

                <div className="info-box">
                    <strong>ℹ️ Note:</strong> We'll verify your UPI ID using Razorpay.
                    In test mode, verification will be marked as pending.
                    In production, your UPI will be validated instantly.
                </div>
            </div>
        </div>
    );
};

export default LinkUPI;
