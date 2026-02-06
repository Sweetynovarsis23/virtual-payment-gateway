/**
 * Format number as currency
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
    const colors = {
        SUCCESS: 'green',
        FAILED: 'red',
        PENDING: 'orange'
    };
    return colors[status] || 'gray';
};

/**
 * Get transaction type label
 */
export const getTransactionTypeLabel = (type) => {
    const labels = {
        PAYIN: 'Pay-in',
        PAYOUT: 'Payout',
        TAX: 'Tax Payment'
    };
    return labels[type] || type;
};
