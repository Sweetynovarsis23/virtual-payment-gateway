import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { GatewayService } from '../services/gatewayService.js';
import { razorpayPayoutService } from '../services/razorpayPayoutService.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { transactionLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Initialize Razorpay
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * POST /api/gateway/create-order
 * Create Razorpay order for payment
 */
router.post('/create-order', authenticate, async (req, res) => {
    try {
        const { amount, type } = req.body; // type: 'payin' or 'payout'

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        const options = {
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`, // Short receipt ID
            notes: {
                userId: req.user._id.toString(),
                userEmail: req.user.email,
                type: type || 'payin'
            }
        };

        const order = await razorpayInstance.orders.create(options);

        res.json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID
            }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order'
        });
    }
});

/**
 * POST /api/gateway/verify-payment
 * Verify Razorpay payment signature and process transaction
 */
router.post('/verify-payment', authenticate, async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount,
            type
        } = req.body;

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Payment verified - process transaction
        let transaction;
        if (type === 'payin') {
            transaction = await GatewayService.processPayin({
                userId: req.user._id,
                amount: amount,
                fromAccount: 'RAZORPAY',
                metadata: {
                    razorpay_order_id,
                    razorpay_payment_id,
                    payment_method: 'razorpay_checkout'
                }
            });
        } else if (type === 'payout') {
            transaction = await GatewayService.processPayout({
                userId: req.user._id,
                amount: amount,
                toAccount: 'RAZORPAY',
                metadata: {
                    razorpay_order_id,
                    razorpay_payment_id,
                    payment_method: 'razorpay_checkout'
                }
            });
        }

        res.json({
            success: true,
            message: 'Payment verified and processed successfully',
            data: {
                txnId: transaction.txnId,
                status: transaction.status,
                amount: transaction.amount
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Payment verification failed'
        });
    }
});

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
 * POST /api/gateway/razorpay-payout
 * Initiate Razorpay Payout (Bank Account or UPI)
 */
router.post('/razorpay-payout', authenticate, transactionLimiter, async (req, res) => {
    try {
        const { amount, accountType, recipientDetails } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        if (!accountType || !['bank_account', 'vpa'].includes(accountType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid account type. Must be bank_account or vpa'
            });
        }

        // Check wallet balance
        const wallet = await req.user.populate('wallet');
        if (!wallet || wallet.wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance'
            });
        }

        // Step 1: Create or get contact
        let contact = await razorpayPayoutService.getContactByReferenceId(userId.toString());

        if (!contact) {
            contact = await razorpayPayoutService.createContact({
                name: recipientDetails.name || req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                userId: userId.toString()
            });
        }

        // Step 2: Create fund account
        const fundAccountData = {
            contactId: contact.id,
            accountType: accountType
        };

        if (accountType === 'bank_account') {
            fundAccountData.accountHolderName = recipientDetails.accountHolderName;
            fundAccountData.accountNumber = recipientDetails.accountNumber;
            fundAccountData.ifsc = recipientDetails.ifsc;
        } else if (accountType === 'vpa') {
            fundAccountData.vpaAddress = recipientDetails.vpaAddress;
        }

        const fundAccount = await razorpayPayoutService.createFundAccount(fundAccountData);

        // Step 3: Create payout
        const referenceId = `payout_${userId}_${Date.now()}`;
        const payout = await razorpayPayoutService.createPayout({
            fundAccountId: fundAccount.id,
            amount: amount,
            currency: 'INR',
            mode: accountType === 'vpa' ? 'UPI' : 'IMPS',
            purpose: 'payout',
            referenceId: referenceId
        });

        // Step 4: Deduct from wallet (only if payout is queued or processing)
        if (payout.status === 'queued' || payout.status === 'processing') {
            wallet.wallet.balance -= amount;
            await wallet.wallet.save();

            // Record transaction
            const transaction = {
                type: 'PAYOUT',
                amount: amount,
                status: 'PENDING',
                metadata: {
                    razorpayPayoutId: payout.id,
                    fundAccountId: fundAccount.id,
                    accountType: accountType,
                    referenceId: referenceId
                }
            };

            wallet.wallet.transactions.push(transaction);
            await wallet.wallet.save();
        }

        res.status(200).json({
            success: true,
            message: 'Payout initiated successfully',
            data: {
                payoutId: payout.id,
                amount: amount,
                status: payout.status,
                utr: payout.utr || null,
                referenceId: referenceId
            }
        });

    } catch (error) {
        console.error('Razorpay Payout error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process payout'
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
