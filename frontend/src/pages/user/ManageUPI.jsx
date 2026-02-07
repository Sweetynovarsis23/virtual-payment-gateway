import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMobileAlt, FaCheckCircle, FaClock, FaTimesCircle, FaTrash, FaStar, FaPlus, FaCreditCard } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { upiAPI } from '../../services/api';
import './ManageUPI.css';

const ManageUPI = () => {
    const [upis, setUpis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUPIs();
    }, []);

    const fetchUPIs = async () => {
        try {
            const response = await upiAPI.getAll();
            setUpis(response.data.data.upis);
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Failed to load UPI IDs'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm('Are you sure you want to remove this UPI ID?')) {
            return;
        }

        try {
            await upiAPI.remove(id);
            setMessage({
                type: 'success',
                text: 'UPI removed successfully'
            });
            fetchUPIs();
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Failed to remove UPI'
            });
        }
    };

    const handleSetPrimary = async (id) => {
        try {
            await upiAPI.setPrimary(id);
            setMessage({
                type: 'success',
                text: 'Primary UPI updated'
            });
            fetchUPIs();
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Failed to set primary UPI'
            });
        }
    };

    if (loading) {
        return <div className="loading">Loading UPI IDs...</div>;
    }

    return (
        <div className="manage-upi-container">
            <div className="page-header">
                <h1 className="page-title">
                    <FaMobileAlt style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Manage UPI IDs
                </h1>
                <button
                    className="btn-primary"
                    onClick={() => navigate('/link-upi')}
                >
                    <FaPlus style={{ marginRight: '0.5rem' }} /> Link New UPI
                </button>
            </div>

            {message && (
                <div className={`message ${message.type} `}>
                    {message.text}
                </div>
            )}

            {upis.length === 0 ? (
                <div className="empty-state">
                    <h2>No UPI IDs Linked</h2>
                    <p>Link your UPI ID to start making payments</p>
                    <button
                        className="btn-add-upi"
                        onClick={() => navigate('/link-upi')}
                    >
                        <FaPlus style={{ marginRight: '0.5rem' }} />
                        Link New UPI
                    </button>
                </div>
            ) : (
                <div className="upis-grid">
                    {upis.map((upi) => {
                        return (
                            <div key={upi.id} className="upi-card">
                                <div className="upi-header">
                                    <div className="upi-icon">
                                        <FaCreditCard size={32} color="#7c3aed" />
                                    </div>
                                    {upi.verificationStatus === 'completed' ? (
                                        <span className="status-badge verified">
                                            <FaCheckCircle style={{ marginRight: '0.25rem' }} />
                                            Verified
                                        </span>
                                    ) : upi.verificationStatus === 'pending' ? (
                                        <span className="status-badge pending">
                                            <FaClock style={{ marginRight: '0.25rem' }} />
                                            Pending
                                        </span>
                                    ) : (
                                        <span className="status-badge failed">
                                            <FaTimesCircle style={{ marginRight: '0.25rem' }} />
                                            Failed
                                        </span>
                                    )}
                                </div>

                                <div className="upi-details">
                                    <div className="upi-vpa">
                                        {upi.vpaAddress}
                                        {upi.isPrimary && (
                                            <span className="primary-badge">
                                                <FaStar style={{ marginRight: '0.25rem' }} />
                                                Primary
                                            </span>
                                        )}
                                    </div>

                                    {upi.holderName && (
                                        <div className="upi-holder">
                                            <span className="label">Account Holder:</span>
                                            <span className="value">{upi.holderName}</span>
                                        </div>
                                    )}

                                    <div className="upi-date">
                                        <span className="label">Linked on:</span>
                                        <span className="value">
                                            {new Date(upi.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="upi-actions">
                                    {!upi.isPrimary && (
                                        <button
                                            className="btn-secondary"
                                            onClick={() => handleSetPrimary(upi.id)}
                                        >
                                            Set as Primary
                                        </button>
                                    )}
                                    <button
                                        className="btn-danger"
                                        onClick={() => handleRemove(upi.id)}
                                        disabled={loading}
                                        title="Remove UPI"
                                    >
                                        <FaTrash style={{ marginRight: '0.25rem' }} />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="info-section">
                <h3>💡 About UPI Verification</h3>
                <ul>
                    <li><strong>Verified (✅):</strong> Your UPI has been validated and is ready for transactions</li>
                    <li><strong>Pending (⏳):</strong> Verification in progress (common in test mode)</li>
                    <li><strong>Primary (⭐):</strong> Your default UPI for quick payments</li>
                </ul>
            </div>
        </div>
    );
};

export default ManageUPI;
