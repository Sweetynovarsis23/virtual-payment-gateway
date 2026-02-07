import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    ifsc: {
        type: String,
        required: true,
        uppercase: true
    },
    accountHolderName: {
        type: String,
        required: true
    },
    bankName: {
        type: String
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationId: {
        type: String // Razorpay fund account ID
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    verifiedAt: {
        type: Date
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
bankAccountSchema.index({ userId: 1, isActive: 1 });

// Prevent duplicate ACTIVE bank accounts for same user (soft delete compatible)
bankAccountSchema.index({ userId: 1, accountNumber: 1, ifsc: 1, isActive: 1 }, { unique: true });

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

export default BankAccount;
