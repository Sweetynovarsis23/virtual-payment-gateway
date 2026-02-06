import { Transaction } from '../models/Transaction.js';
import { WalletService } from './walletService.js';
import { TreasuryService } from './treasuryService.js';
import { AuditService } from './auditService.js';

/**
 * Gateway Service - Core payment processing engine
 * Simulates transaction processing for demo purposes
 */
export class GatewayService {
    /**
     * Process Pay-in transaction
     * @param {object} data - Transaction data
     * @returns {object} - Transaction result
     */
    static async processPayin(data) {
        const startTime = Date.now();
        let transaction;

        try {
            // Generate transaction ID
            let txnId;
            let isUnique = false;

            while (!isUnique) {
                txnId = Transaction.generateTxnId();
                const existing = await Transaction.findOne({ txnId });
                if (!existing) isUnique = true;
            }

            // Create pending transaction
            transaction = new Transaction({
                txnId,
                userId: data.userId,
                type: 'PAYIN',
                amount: data.amount,
                status: 'PENDING',
                fromAccount: data.fromAccount || 'EXTERNAL_BANK',
                toAccount: 'WALLET',
                metadata: data.metadata || {}
            });

            await transaction.save();

            // Simulate processing delay (2 seconds)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simulate success/failure (95% success rate)
            const isSuccess = Math.random() < 0.95;

            if (isSuccess) {
                // Update wallet balance
                await WalletService.updateBalance(data.userId, data.amount, 'add');

                transaction.status = 'SUCCESS';
                transaction.completedAt = new Date();
            } else {
                transaction.status = 'FAILED';
                transaction.metadata.failureReason = 'Simulated payment failure';
            }

            const endTime = Date.now();
            transaction.processingTime = endTime - startTime;
            await transaction.save();

            // Log audit trail
            await AuditService.log({
                userId: data.userId,
                action: 'PAYIN_TRANSACTION',
                resource: txnId,
                status: isSuccess ? 'success' : 'failed',
                metadata: { amount: data.amount }
            });

            return transaction;
        } catch (error) {
            console.error('Pay-in processing error:', error);

            if (transaction) {
                transaction.status = 'FAILED';
                transaction.metadata.error = error.message;
                await transaction.save();
            }

            throw error;
        }
    }

    /**
     * Process Payout transaction
     * @param {object} data - Transaction data
     * @returns {object} - Transaction result
     */
    static async processPayout(data) {
        const startTime = Date.now();
        let transaction;

        try {
            // Generate transaction ID
            let txnId;
            let isUnique = false;

            while (!isUnique) {
                txnId = Transaction.generateTxnId();
                const existing = await Transaction.findOne({ txnId });
                if (!existing) isUnique = true;
            }

            // Check wallet balance first
            const wallet = await WalletService.getWallet(data.userId);
            if (!wallet || wallet.balance < data.amount) {
                throw new Error('Insufficient balance');
            }

            // Create pending transaction
            transaction = new Transaction({
                txnId,
                userId: data.userId,
                type: 'PAYOUT',
                amount: data.amount,
                status: 'PENDING',
                fromAccount: 'WALLET',
                toAccount: data.toAccount || 'EXTERNAL_BANK',
                metadata: data.metadata || {}
            });

            await transaction.save();

            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simulate success/failure (95% success rate)
            const isSuccess = Math.random() < 0.95;

            if (isSuccess) {
                // Deduct from wallet
                await WalletService.updateBalance(data.userId, data.amount, 'subtract');

                transaction.status = 'SUCCESS';
                transaction.completedAt = new Date();
            } else {
                transaction.status = 'FAILED';
                transaction.metadata.failureReason = 'Simulated payout failure';
            }

            const endTime = Date.now();
            transaction.processingTime = endTime - startTime;
            await transaction.save();

            // Log audit trail
            await AuditService.log({
                userId: data.userId,
                action: 'PAYOUT_TRANSACTION',
                resource: txnId,
                status: isSuccess ? 'success' : 'failed',
                metadata: { amount: data.amount }
            });

            return transaction;
        } catch (error) {
            console.error('Payout processing error:', error);

            if (transaction) {
                transaction.status = 'FAILED';
                transaction.metadata.error = error.message;
                await transaction.save();
            }

            throw error;
        }
    }

    /**
     * Process Tax Payment to Government Treasury
     * @param {object} data - Transaction data
     * @returns {object} - Transaction result
     */
    static async processTaxPayment(data) {
        const startTime = Date.now();
        let transaction;

        try {
            // Generate transaction ID
            let txnId;
            let isUnique = false;

            while (!isUnique) {
                txnId = Transaction.generateTxnId();
                const existing = await Transaction.findOne({ txnId });
                if (!existing) isUnique = true;
            }

            // Check wallet balance
            const wallet = await WalletService.getWallet(data.userId);
            if (!wallet || wallet.balance < data.amount) {
                throw new Error('Insufficient balance for tax payment');
            }

            // Create pending transaction
            transaction = new Transaction({
                txnId,
                userId: data.userId,
                type: 'TAX',
                amount: data.amount,
                status: 'PENDING',
                fromAccount: 'WALLET',
                toAccount: 'GOVERNMENT_TREASURY',
                metadata: {
                    taxType: data.taxType || 'GENERAL',
                    ...data.metadata
                }
            });

            await transaction.save();

            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Tax payments have higher success rate (98%)
            const isSuccess = Math.random() < 0.98;

            if (isSuccess) {
                // Deduct from wallet
                await WalletService.updateBalance(data.userId, data.amount, 'subtract');

                // Add to treasury
                await TreasuryService.addFunds(data.amount);

                transaction.status = 'SUCCESS';
                transaction.completedAt = new Date();
                transaction.metadata.receiptId = `RCPT-${txnId}`;
            } else {
                transaction.status = 'FAILED';
                transaction.metadata.failureReason = 'Treasury connection error';
            }

            const endTime = Date.now();
            transaction.processingTime = endTime - startTime;
            await transaction.save();

            // Log audit trail
            await AuditService.log({
                userId: data.userId,
                action: 'TAX_PAYMENT',
                resource: txnId,
                status: isSuccess ? 'success' : 'failed',
                metadata: { amount: data.amount, taxType: data.taxType }
            });

            return transaction;
        } catch (error) {
            console.error('Tax payment processing error:', error);

            if (transaction) {
                transaction.status = 'FAILED';
                transaction.metadata.error = error.message;
                await transaction.save();
            }

            throw error;
        }
    }

    /**
     * Get transaction status
     * @param {string} txnId - Transaction ID
     * @returns {object} - Transaction
     */
    static async getTransactionStatus(txnId) {
        try {
            const transaction = await Transaction.findOne({ txnId })
                .populate('userId', 'email');

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            return transaction;
        } catch (error) {
            console.error('Error fetching transaction status:', error);
            throw error;
        }
    }

    /**
     * Verify transaction
     * @param {string} txnId - Transaction ID
     * @returns {object} - Verification result
     */
    static async verifyTransaction(txnId) {
        try {
            const transaction = await this.getTransactionStatus(txnId);

            return {
                txnId: transaction.txnId,
                isValid: true,
                status: transaction.status,
                amount: transaction.amount,
                type: transaction.type,
                timestamp: transaction.createdAt
            };
        } catch (error) {
            return {
                txnId,
                isValid: false,
                error: error.message
            };
        }
    }
}
