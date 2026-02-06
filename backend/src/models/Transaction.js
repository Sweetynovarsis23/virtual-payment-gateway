import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    txnId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['PAYIN', 'PAYOUT', 'TAX'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
    },
    fromAccount: {
        type: String
    },
    toAccount: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    processingTime: {
        type: Number // in milliseconds
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Method to generate transaction ID
transactionSchema.statics.generateTxnId = function () {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `TXN-${year}-${random}`;
};

export const Transaction = mongoose.model('Transaction', transactionSchema);
