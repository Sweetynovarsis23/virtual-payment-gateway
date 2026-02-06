import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import Treasury from '../models/Treasury.js';
import AuditLog from '../models/AuditLog.js';

export const getAdminStats = async (req, res) => {
    try {
        // Total users
        const totalUsers = await User.countDocuments();

        // Total transactions
        const totalTransactions = await Transaction.countDocuments();

        // Transaction stats by type
        const transactionStats = await Transaction.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Total wallet balance across all users
        const walletStats = await Wallet.aggregate([
            {
                $group: {
                    _id: null,
                    totalBalance: { $sum: '$balance' }
                }
            }
        ]);

        // Treasury balance
        const treasury = await Treasury.findOne({ accountType: 'TREASURY_MASTER' });

        // Recent transactions
        const recentTransactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'email');

        // Success rate
        const successCount = await Transaction.countDocuments({ status: 'SUCCESS' });
        const successRate = totalTransactions > 0
            ? ((successCount / totalTransactions) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalTransactions,
                    totalWalletBalance: walletStats[0]?.totalBalance || 0,
                    treasuryBalance: treasury?.balance || 0,
                    successRate: parseFloat(successRate)
                },
                transactionStats: transactionStats.reduce((acc, stat) => {
                    acc[stat._id] = {
                        count: stat.count,
                        totalAmount: stat.totalAmount
                    };
                    return acc;
                }, {}),
                recentTransactions
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin statistics'
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;

        const query = search
            ? { email: { $regex: search, $options: 'i' } }
            : {};

        const users = await User.find(query)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await User.countDocuments(query);

        // Get wallet info for each user
        const usersWithWallets = await Promise.all(
            users.map(async (user) => {
                const wallet = await Wallet.findOne({ userId: user._id });
                return {
                    ...user.toObject(),
                    wallet: wallet ? {
                        balance: wallet.balance,
                        virtualAccountNo: wallet.virtualAccountNo
                    } : null
                };
            })
        );

        res.json({
            success: true,
            data: {
                users: usersWithWallets,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                totalUsers: count
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};

export const getAllTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 50, type = '', status = '' } = req.query;

        const query = {};
        if (type) query.type = type;
        if (status) query.status = status;

        const transactions = await Transaction.find(query)
            .populate('userId', 'email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Transaction.countDocuments(query);

        res.json({
            success: true,
            data: {
                transactions,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                totalTransactions: count
            }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions'
        });
    }
};

export const getTreasuryDetails = async (req, res) => {
    try {
        const treasury = await Treasury.findOne({ accountType: 'TREASURY_MASTER' });

        if (!treasury) {
            return res.status(404).json({
                success: false,
                message: 'Treasury not found'
            });
        }

        // Get all tax transactions
        const taxTransactions = await Transaction.find({ type: 'TAX' })
            .populate('userId', 'email')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            data: {
                treasury,
                recentTaxPayments: taxTransactions
            }
        });
    } catch (error) {
        console.error('Error fetching treasury details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch treasury details'
        });
    }
};

export const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, action = '' } = req.query;

        const query = action ? { action } : {};

        const logs = await AuditLog.find(query)
            .populate('userId', 'email')
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await AuditLog.countDocuments(query);

        res.json({
            success: true,
            data: {
                logs,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                totalLogs: count
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs'
        });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user },
            message: `User role updated to ${role}`
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role'
        });
    }
};
