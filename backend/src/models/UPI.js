import mongoose from 'mongoose';

const upiSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    vpaAddress: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    holderName: {
        type: String
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationId: {
        type: String // Razorpay validation ID
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
upiSchema.index({ userId: 1, isActive: 1 });

// Prevent duplicate ACTIVE UPI IDs for same user (soft delete compatible)
upiSchema.index({ userId: 1, vpaAddress: 1, isActive: 1 }, { unique: true });

const UPI = mongoose.model('UPI', upiSchema);

export default UPI;
