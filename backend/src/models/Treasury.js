import mongoose from 'mongoose';

const treasurySchema = new mongoose.Schema({
    accountType: {
        type: String,
        default: 'TREASURY_MASTER'
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCollected: {
        type: Number,
        default: 0,
        min: 0
    },
    lastTransaction: {
        type: Date
    }
}, {
    timestamps: true
});

export const Treasury = mongoose.model('Treasury', treasurySchema);
