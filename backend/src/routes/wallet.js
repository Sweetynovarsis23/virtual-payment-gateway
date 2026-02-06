import express from 'express';
import { WalletService } from '../services/walletService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/wallet/balance
 * Get wallet balance
 */
router.get('/balance', authenticate, async (req, res) => {
    try {
        const wallet = await WalletService.getWallet(req.user._id);

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        res.json({
            success: true,
            data: {
                balance: wallet.balance,
                virtualAccountNo: wallet.virtualAccountNo,
                status: wallet.status
            }
        });
    } catch (error) {
        console.error('Balance fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch balance'
        });
    }
});

/**
 * GET /api/wallet/history
 * Get transaction history
 */
router.get('/history', authenticate, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const transactions = await WalletService.getTransactionHistory(req.user._id, limit);

        res.json({
            success: true,
            data: {
                transactions: transactions.map(txn => ({
                    txnId: txn.txnId,
                    type: txn.type,
                    amount: txn.amount,
                    status: txn.status,
                    fromAccount: txn.fromAccount,
                    toAccount: txn.toAccount,
                    createdAt: txn.createdAt,
                    completedAt: txn.completedAt
                })),
                count: transactions.length
            }
        });
    } catch (error) {
        console.error('Transaction history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction history'
        });
    }
});

/**
 * GET /api/wallet/virtual-account
 * Get virtual account details
 */
router.get('/virtual-account', authenticate, async (req, res) => {
    try {
        const wallet = await WalletService.getWallet(req.user._id);

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        res.json({
            success: true,
            data: {
                virtualAccountNo: wallet.virtualAccountNo,
                accountHolderName: req.user.email.split('@')[0].toUpperCase(),
                bankName: 'Virtual Payment Gateway Bank',
                ifscCode: 'VPG0000001',
                status: wallet.status
            }
        });
    } catch (error) {
        console.error('Virtual account fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch virtual account details'
        });
    }
});

export default router;
