import express from 'express';
import { GatewayService } from '../services/gatewayService.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { transactionLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * POST /api/gateway/payin
 * Process pay-in transaction
 */
router.post('/payin', authenticate, transactionLimiter, validate('payin'), async (req, res) => {
    try {
        const { amount, fromAccount, metadata } = req.body;

        const transaction = await GatewayService.processPayin({
            userId: req.user._id,
            amount,
            fromAccount,
            metadata
        });

        res.status(transaction.status === 'SUCCESS' ? 200 : 400).json({
            success: transaction.status === 'SUCCESS',
            message: transaction.status === 'SUCCESS'
                ? 'Pay-in processed successfully'
                : 'Pay-in failed',
            data: {
                txnId: transaction.txnId,
                status: transaction.status,
                amount: transaction.amount,
                processingTime: transaction.processingTime,
                completedAt: transaction.completedAt
            }
        });
    } catch (error) {
        console.error('Pay-in error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Pay-in processing failed'
        });
    }
});

/**
 * POST /api/gateway/payout
 * Process payout transaction
 */
router.post('/payout', authenticate, transactionLimiter, validate('payout'), async (req, res) => {
    try {
        const { amount, toAccount, metadata } = req.body;

        const transaction = await GatewayService.processPayout({
            userId: req.user._id,
            amount,
            toAccount,
            metadata
        });

        res.status(transaction.status === 'SUCCESS' ? 200 : 400).json({
            success: transaction.status === 'SUCCESS',
            message: transaction.status === 'SUCCESS'
                ? 'Payout processed successfully'
                : 'Payout failed',
            data: {
                txnId: transaction.txnId,
                status: transaction.status,
                amount: transaction.amount,
                processingTime: transaction.processingTime,
                completedAt: transaction.completedAt
            }
        });
    } catch (error) {
        console.error('Payout error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Payout processing failed'
        });
    }
});

/**
 * POST /api/gateway/pay-tax
 * Process tax payment to treasury
 */
router.post('/pay-tax', authenticate, transactionLimiter, validate('payTax'), async (req, res) => {
    try {
        const { amount, taxType, metadata } = req.body;

        const transaction = await GatewayService.processTaxPayment({
            userId: req.user._id,
            amount,
            taxType,
            metadata
        });

        res.status(transaction.status === 'SUCCESS' ? 200 : 400).json({
            success: transaction.status === 'SUCCESS',
            message: transaction.status === 'SUCCESS'
                ? 'Tax payment processed successfully'
                : 'Tax payment failed',
            data: {
                txnId: transaction.txnId,
                status: transaction.status,
                amount: transaction.amount,
                receiptId: transaction.metadata.receiptId,
                processingTime: transaction.processingTime,
                completedAt: transaction.completedAt
            }
        });
    } catch (error) {
        console.error('Tax payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Tax payment processing failed'
        });
    }
});

/**
 * GET /api/gateway/status/:txnId
 * Get transaction status
 */
router.get('/status/:txnId', authenticate, async (req, res) => {
    try {
        const { txnId } = req.params;

        const transaction = await GatewayService.getTransactionStatus(txnId);

        res.json({
            success: true,
            data: {
                txnId: transaction.txnId,
                type: transaction.type,
                amount: transaction.amount,
                status: transaction.status,
                fromAccount: transaction.fromAccount,
                toAccount: transaction.toAccount,
                createdAt: transaction.createdAt,
                completedAt: transaction.completedAt,
                processingTime: transaction.processingTime
            }
        });
    } catch (error) {
        console.error('Transaction status error:', error);
        res.status(404).json({
            success: false,
            message: error.message || 'Transaction not found'
        });
    }
});

/**
 * GET /api/gateway/verify/:txnId
 * Verify transaction
 */
router.get('/verify/:txnId', authenticate, async (req, res) => {
    try {
        const { txnId } = req.params;

        const verification = await GatewayService.verifyTransaction(txnId);

        res.json({
            success: verification.isValid,
            data: verification
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});

export default router;
