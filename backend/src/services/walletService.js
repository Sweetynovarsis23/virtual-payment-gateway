import { Wallet } from '../models/Wallet.js';
import { Transaction } from '../models/Transaction.js';

/**
 * Wallet Service - Manages wallet operations
 */
export class WalletService {
    /**
     * Create a new wallet for a user
     * @param {string} userId - User ID
     * @returns {object} - Created wallet
     */
    static async createWallet(userId) {
        try {
            // Generate unique virtual account number
            let virtualAccountNo;
            let isUnique = false;

            while (!isUnique) {
                virtualAccountNo = Wallet.generateVirtualAccountNo();
                const existing = await Wallet.findOne({ virtualAccountNo });
                if (!existing) isUnique = true;
            }

            const wallet = new Wallet({
                userId,
                virtualAccountNo,
                balance: 0
            });

            await wallet.save();
            return wallet;
        } catch (error) {
            console.error('Error creating wallet:', error);
            throw error;
        }
    }

    /**
     * Get wallet by user ID
     * @param {string} userId - User ID
     * @returns {object} - Wallet
     */
    static async getWallet(userId) {
        try {
            return await Wallet.findOne({ userId });
        } catch (error) {
            console.error('Error fetching wallet:', error);
            throw error;
        }
    }

    /**
     * Update wallet balance
     * @param {string} userId - User ID
     * @param {number} amount - Amount to add/subtract
     * @param {string} operation - 'add' or 'subtract'
     * @returns {object} - Updated wallet
     */
    static async updateBalance(userId, amount, operation = 'add') {
        try {
            const wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                throw new Error('Wallet not found');
            }

            if (operation === 'add') {
                wallet.balance += amount;
            } else if (operation === 'subtract') {
                if (wallet.balance < amount) {
                    throw new Error('Insufficient balance');
                }
                wallet.balance -= amount;
            }

            await wallet.save();
            return wallet;
        } catch (error) {
            console.error('Error updating balance:', error);
            throw error;
        }
    }

    /**
     * Get transaction history for a user
     * @param {string} userId - User ID
     * @param {number} limit - Number of transactions
     * @returns {Array} - Transactions
     */
    static async getTransactionHistory(userId, limit = 50) {
        try {
            return await Transaction.find({ userId })
                .sort({ createdAt: -1 })
                .limit(limit);
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            throw error;
        }
    }
}
