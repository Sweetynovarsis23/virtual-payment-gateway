import axios from 'axios';

// Use environment variable in production, localhost in development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile')
};

// Gateway API
export const gatewayAPI = {
    payin: (data) => api.post('/gateway/payin', data),
    payout: (data) => api.post('/gateway/payout', data),
    payTax: (data) => api.post('/gateway/pay-tax', data),
    createOrder: (data) => api.post('/gateway/create-order', data),
    verifyPayment: (data) => api.post('/gateway/verify-payment', data),
    getStatus: (txnId) => api.get(`/gateway/status/${txnId}`),
    verify: (txnId) => api.get(`/gateway/verify/${txnId}`)
};

// Wallet API
export const walletAPI = {
    getBalance: () => api.get('/wallet/balance'),
    getHistory: (limit = 50) => api.get(`/wallet/history?limit=${limit}`),
    getVirtualAccount: () => api.get('/wallet/virtual-account')
};

// Bank Account API
export const bankAccountAPI = {
    link: (data) => api.post('/bank-accounts/link', data),
    getAll: () => api.get('/bank-accounts'),
    remove: (id) => api.delete(`/bank-accounts/${id}`),
    setPrimary: (id) => api.patch(`/bank-accounts/${id}/primary`)
};

// UPI API
export const upiAPI = {
    link: (data) => api.post('/upi/link', data),
    getAll: () => api.get('/upi'),
    remove: (id) => api.delete(`/upi/${id}`),
    setPrimary: (id) => api.patch(`/upi/${id}/primary`)
};

// Admin API
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getUsers: () => api.get('/admin/users'),
    getTransactions: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return api.get(`/admin/transactions${params ? '?' + params : ''}`);
    },
    getTreasury: () => api.get('/admin/treasury'),
    getAuditLogs: (limit = 100) => api.get(`/admin/audit-logs?limit=${limit}`)
};

export default api;
