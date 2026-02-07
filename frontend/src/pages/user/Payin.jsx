import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { gatewayAPI, bankAccountAPI } from '../../services/api';
import './TransactionPages.css';
import './PaymentMethodSelector.css';

const Payin = () => {
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'bank'
    const [selectedBankAccount, setSelectedBankAccount] = useState('');
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [message, setMessage] = useState(null);
    const { wallet, user, refreshWallet } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchBankAccounts();
    }, []);

    const fetchBankAccounts = async () => {
        try {
            const response = await bankAccountAPI.getAll();
            const accounts = response.data.data.accounts;
            const activeAccounts = accounts.filter(acc => acc.verificationStatus !== 'failed');
            setBankAccounts(activeAccounts);

            const primaryAccount = activeAccounts.find(acc => acc.isPrimary);
            if (primaryAccount) {
                setSelectedBankAccount(primaryAccount.id);
            }
        } catch (error) {
            console.error('Failed to fetch bank accounts:', error);
        } finally {
            setLoadingAccounts(false);
        }
    };

    const openRazorpayCheckout = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid amount' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            // Create order
            const orderResponse = await gatewayAPI.createOrder({
                amount: parseFloat(amount),
                type: 'payin'
            });

            const { orderId, amount: orderAmount, currency, key } = orderResponse.data.data;

            // Razorpay options
            const options = {
                key: key,
                amount: orderAmount,
                currency: currency,
                name: 'Virtual Payment Gateway',
                description: 'Add money to wallet',
                order_id: orderId,
                handler: async function (response) {
                    try {
                        // Verify payment on backend
                        const verifyResponse = await gatewayAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: parseFloat(amount),
                            type: 'payin'
                        });

                        if (verifyResponse.data.success) {
                            await refreshWallet(); // Refresh wallet balance
                            setMessage({
                                type: 'success',
                                text: `Successfully added ₹${amount} to your wallet!`
                            });
                            setAmount('');
                            setTimeout(() => navigate('/dashboard'), 2000);
                        }
                    } catch (error) {
                        setMessage({
                            type: 'error',
                            text: 'Payment verification failed'
                        });
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email
                },
                theme: {
                    color: '#1e40af'
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        setMessage({ type: 'error', text: 'Payment cancelled' });
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Razorpay error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to initiate payment'
            });
            setLoading(false);
        }
    };

    const handleBankPayment = async (e) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            const response = await gatewayAPI.payin({
                amount: parseFloat(amount),
                fromAccount: selectedBankAccount
            });

            const data = response.data.data;
            setMessage({
                type: data.status === 'SUCCESS' ? 'success' : 'error',
                text: data.status === 'SUCCESS'
                    ? `Successfully added ₹${amount} to your wallet!`
                    : 'Transaction failed. Please try again.'
            });

            if (data.status === 'SUCCESS') {
                await refreshWallet(); // Refresh wallet balance
                setAmount('');
                setTimeout(() => navigate('/dashboard'), 2000);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to process payment'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="transaction-container">
            <h1 className="page-title">Add Money (Payin)</h1>

            <div className="transaction-card">
                <div className="card-icon">
                    <FaMoneyBillWave size={48} color="#10b981" />
                </div>

                <p className="card-description">
                    Add money to your virtual wallet
                </p>

                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Payment Method Selection */}
                <div className="payment-method-selector">
                    <label>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="razorpay"
                            checked={paymentMethod === 'razorpay'}
                            onChange={() => setPaymentMethod('razorpay')}
                        />
                        <span>Razorpay (UPI, Cards, Netbanking, Wallets)</span>
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="bank"
                            checked={paymentMethod === 'bank'}
                            onChange={() => setPaymentMethod('bank')}
                        />
                        <span>Linked Bank Account</span>
                    </label>
                </div>

                {/* Amount Input */}
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
                </div>

                {/* Razorpay Payment */}
                {paymentMethod === 'razorpay' && (
                    <div>
                        <button
                            className="btn-primary razorpay-btn"
                            onClick={openRazorpayCheckout}
                            disabled={loading}
                        >
                            <FaCreditCard style={{ marginRight: '0.5rem' }} />
                            {loading ? 'Processing...' : 'Pay with Razorpay'}
                        </button>
                        <div className="info-box" style={{ marginTop: '1rem' }}>
                            <strong>✨ All Payment Methods Available:</strong>
                            <ul>
                                <li>UPI (QR Code, PhonePe, Google Pay, Paytm, etc.)</li>
                                <li>Credit/Debit Cards</li>
                                <li>Netbanking</li>
                                <li>Wallets & More</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Bank Account Payment */}
                {paymentMethod === 'bank' && (
                    <form onSubmit={handleBankPayment}>
                        <div className="form-group">
                            <label>From Bank Account</label>
                            {loadingAccounts ? (
                                <p style={{ color: '#666' }}>Loading bank accounts...</p>
                            ) : bankAccounts.length > 0 ? (
                                <>
                                    <select
                                        value={selectedBankAccount}
                                        onChange={(e) => setSelectedBankAccount(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Account</option>
                                        {bankAccounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.bankName} - {account.accountNumber}
                                                {account.isPrimary && ' ⭐'}
                                            </option>
                                        ))}
                                    </select>
                                    <small style={{ display: 'block', marginTop: '0.25rem' }}>
                                        <a href="/link-bank-account" style={{ color: '#2563eb' }}>
                                            Link new account
                                        </a>
                                    </small>
                                </>
                            ) : (
                                <div>
                                    <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                                        No linked bank accounts found
                                    </p>
                                    <a
                                        href="/link-bank-account"
                                        className="btn-primary"
                                        style={{ display: 'inline-block', padding: '0.5rem 1rem', textDecoration: 'none' }}
                                    >
                                        Link Bank Account
                                    </a>
                                </div>
                            )}
                        </div>

                        {bankAccounts.length > 0 && (
                            <button type="submit" className="btn-primary" disabled={loading || !selectedBankAccount}>
                                {loading ? 'Processing...' : 'Add Money from Bank'}
                            </button>
                        )}
                    </form>
                )}

                <div className="info-box" style={{ marginTop: '1.5rem' }}>
                    <strong>Note:</strong> This is a simulated transaction for testing purposes.
                </div>
            </div>
        </div>
    );
};

export default Payin;
