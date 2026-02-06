import express from 'express';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { TreasuryService } from '../services/treasuryService.js';
import { AuditService } from '../services/auditService.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin authorization
router.use(authenticate);
router.use(authorizeAdmin);

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
    try {
        // Get total users
        const totalUsers = await User.countDocuments({ role: 'user' });

        // Get transaction statistics
        const totalPayin = await Transaction.aggregate([
            { $match: { type: 'PAYIN', status: 'SUCCESS' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalPayout = await Transaction.aggregate([
            { $match: { type: 'PAYOUT', status: 'SUCCESS' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const pendingTransactions = await Transaction.countDocuments({ status: 'PENDING' });

        // Get treasury stats
        const treasury = await TreasuryService.getTreasuryStats();

        res.json({
            success: true,
            data: {
                totalUsers,
                totalPayin: totalPayin[0]?.total || 0,
                totalPayout: totalPayout[0]?.total || 0,
                pendingTransactions,
                treasuryBalance: treasury?.balance || 0,
                totalTaxCollected: treasury?.totalCollected || 0
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({ role: 'user' })
            .select('-passwordHash')
            .populate({
                path: 'wallet',
                select: 'virtualAccountNo balance status'
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                users: users.map(user => ({
                    id: user._id,
                    email: user.email,
                    wallet: user.wallet,
                    createdAt: user.createdAt
                })),
                count: users.length
            }
        });
    } catch (error) {
        console.error('Admin users fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

/**
 * GET /api/admin/transactions
 * Get all transactions
 */
router.get('/transactions', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const type = req.query.type; // PAYIN, PAYOUT, TAX
        const status = req.query.status; // PENDING, SUCCESS, FAILED

        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;

        const transactions = await Transaction.find(filter)
            .populate('userId', 'email')
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json({
            success: true,
            data: {
                transactions: transactions.map(txn => ({
                    txnId: txn.txnId,
                    userEmail: txn.userId?.email,
                    type: txn.type,
                    amount: txn.amount,
                    status: txn.status,
                    fromAccount: txn.fromAccount,
                    toAccount: txn.toAccount,
                    processingTime: txn.processingTime,
                    createdAt: txn.createdAt,
                    completedAt: txn.completedAt
                })),
                count: transactions.length
            }
        });
    } catch (error) {
        console.error('Admin transactions fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions'
        });
    }
});

/**
 * GET /api/admin/treasury
 * Get treasury details and transactions
 */
router.get('/treasury', async (req, res) => {
    try {
        const treasury = await TreasuryService.getTreasuryStats();

        const taxTransactions = await Transaction.find({
            type: 'TAX',
            status: 'SUCCESS'
        })
            .populate('userId', 'email')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            data: {
                treasury: {
                    balance: treasury?.balance || 0,
                    totalCollected: treasury?.totalCollected || 0,
                    lastTransaction: treasury?.lastTransaction
                },
                recentTransactions: taxTransactions.map(txn => ({
                    txnId: txn.txnId,
                    userEmail: txn.userId?.email,
                    amount: txn.amount,
                    receiptId: txn.metadata?.receiptId,
                    createdAt: txn.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Treasury fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch treasury data'
        });
    }
});

/**
 * GET /api/admin/audit-logs
 * Get audit logs
 */
router.get('/audit-logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = await AuditService.getLogs({}, limit);

        res.json({
            success: true,
            data: {
                logs: logs.map(log => ({
                    id: log._id,
                    userEmail: log.userId?.email || 'System',
                    action: log.action,
                    resource: log.resource,
                    status: log.status,
                    ipAddress: log.ipAddress,
                    timestamp: log.timestamp
                })),
                count: logs.length
            }
        });
    } catch (error) {
        console.error('Audit logs fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs'
        });
    }
});

export default router;
