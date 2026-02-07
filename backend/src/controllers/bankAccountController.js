import Razorpay from 'razorpay';
import BankAccount from '../models/BankAccount.js';
import { AuditService } from '../services/auditService.js';

// Initialize Razorpay (will use test mode during development)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'test_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret'
});

// IFSC to Bank Name mapping (partial - can be expanded)
const ifscToBankName = (ifsc) => {
    const bankCodes = {
        'HDFC': 'HDFC Bank',
        'ICIC': 'ICICI Bank',
        'SBIN': 'State Bank of India',
        'AXIS': 'Axis Bank',
        'PUNB': 'Punjab National Bank',
        'UBIN': 'Union Bank of India',
        'BARB': 'Bank of Baroda',
        'IDIB': 'Indian Bank',
        'CNRB': 'Canara Bank',
        'CBIN': 'Center Bank of India'
    };

    const code = ifsc.substring(0, 4);
    return bankCodes[code] || 'Other Bank';
};

// Link new bank account with verification
export const linkBankAccount = async (req, res) => {
    try {
        const { accountNumber, ifsc, accountHolderName } = req.body;
        const userId = req.user.id;

        // Validate inputs
        if (!accountNumber || !ifsc || !accountHolderName) {
            return res.status(400).json({
                success: false,
                message: 'Account number, IFSC, and account holder name are required'
            });
        }

        // Validate IFSC format (11 characters)
        if (ifsc.length !== 11) {
            return res.status(400).json({
                success: false,
                message: 'Invalid IFSC code format'
            });
        }

        // Check if account already linked
        const existing = await BankAccount.findOne({
            userId,
            accountNumber,
            ifsc: ifsc.toUpperCase(),
            isActive: true
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'This bank account is already linked'
            });
        }

        // Get bank name from IFSC
        const bankName = ifscToBankName(ifsc.toUpperCase());

        // Create fund account in Razorpay for verification
        // Note: Razorpay SDK v2.9.6 doesn't support contacts.create
        // For production, use Razorpay's Account Validation API or upgrade SDK
        let verificationId = null;
        let verificationStatus = 'pending';

        try {
            console.log('🔐 Initiating Razorpay penny-drop verification...');

            if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
                const authToken = Buffer.from(
                    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
                ).toString('base64');

                // Step 1: Create Contact
                console.log('Step 1/3: Creating contact...');
                const contactResponse = await fetch('https://api.razorpay.com/v1/contacts', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: accountHolderName,
                        email: req.user.email,
                        contact: '9999999999',
                        type: 'customer',
                        reference_id: `user_${userId}`
                    })
                });

                if (!contactResponse.ok) {
                    const errorData = await contactResponse.json();
                    throw new Error(`Contact creation failed: ${errorData.error?.description || 'Unknown error'}`);
                }

                const contact = await contactResponse.json();
                console.log('✅ Contact created:', contact.id);

                // Step 2: Create Fund Account
                console.log('Step 2/3: Creating fund account...');
                const fundAccountResponse = await fetch('https://api.razorpay.com/v1/fund_accounts', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contact_id: contact.id,
                        account_type: 'bank_account',
                        bank_account: {
                            name: accountHolderName,
                            ifsc: ifsc.toUpperCase(),
                            account_number: accountNumber
                        }
                    })
                });

                if (!fundAccountResponse.ok) {
                    const errorData = await fundAccountResponse.json();
                    throw new Error(`Fund account creation failed: ${errorData.error?.description || 'Unknown error'}`);
                }

                const fundAccount = await fundAccountResponse.json();
                console.log('✅ Fund account created:', fundAccount.id);

                // Step 3: Create Account Validation (Penny Drop)
                console.log('Step 3/3: Initiating penny-drop validation...');
                const validationResponse = await fetch('https://api.razorpay.com/v1/fund_accounts/validations', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fund_account: {
                            id: fundAccount.id
                        },
                        amount: 100, // ₹1.00 in paise
                        currency: 'INR',
                        notes: {
                            purpose: 'Account verification for VPG'
                        }
                    })
                });

                if (!validationResponse.ok) {
                    const errorData = await validationResponse.json();
                    throw new Error(`Account validation failed: ${errorData.error?.description || 'Unknown error'}`);
                }

                const validation = await validationResponse.json();
                console.log('✅ Validation initiated:', validation.id);
                console.log('Validation status:', validation.status);

                verificationId = validation.id;
                verificationStatus = validation.status === 'completed' ? 'completed' : 'pending';

                console.log('🎉 Razorpay penny-drop verification completed!');
            } else {
                console.log('ℹ️  No Razorpay keys - marking as pending');
                verificationStatus = 'pending';
            }

        } catch (razorpayError) {
            console.error('❌ Razorpay verification error:', razorpayError.message);
            console.error('Details:', razorpayError);
            // Continue with pending status if Razorpay fails
            verificationStatus = 'pending';
        }

        // Save to database
        const bankAccount = await BankAccount.create({
            userId,
            accountNumber,
            ifsc: ifsc.toUpperCase(),
            accountHolderName,
            bankName,
            verified: verificationStatus === 'completed',
            verificationId,
            verificationStatus,
            verifiedAt: verificationStatus === 'completed' ? new Date() : null,
            // Set as primary if this is the first account
            isPrimary: await BankAccount.countDocuments({ userId, isActive: true }) === 0
        });

        // Audit log
        await AuditService.log({
            userId,
            action: 'LINK_BANK_ACCOUNT',
            resource: 'BankAccount',
            status: 'success',
            ipAddress: req.ip,
            metadata: {
                bankAccountId: bankAccount._id,
                bankName,
                ifsc: ifsc.toUpperCase()
            }
        });

        res.status(201).json({
            success: true,
            message: 'Bank account linked successfully',
            data: {
                id: bankAccount._id,
                accountHolderName: bankAccount.accountHolderName,
                bankName: bankAccount.bankName,
                ifsc: bankAccount.ifsc,
                accountNumber: '****' + accountNumber.slice(-4), // Masked
                verified: bankAccount.verified,
                isPrimary: bankAccount.isPrimary,
                verificationStatus: bankAccount.verificationStatus
            }
        });

    } catch (error) {
        console.error('Link bank account error:', error);

        await AuditService.log({
            userId: req.user.id,
            action: 'LINK_BANK_ACCOUNT',
            resource: 'BankAccount',
            status: 'failed',
            ipAddress: req.ip,
            metadata: { error: error.message }
        });

        res.status(500).json({
            success: false,
            message: 'Failed to link bank account'
        });
    }
};

// Get all linked bank accounts for user
export const getBankAccounts = async (req, res) => {
    try {
        const userId = req.user.id;

        const accounts = await BankAccount.find({
            userId,
            isActive: true
        }).sort({ isPrimary: -1, createdAt: -1 });

        const formattedAccounts = accounts.map(account => ({
            id: account._id,
            accountHolderName: account.accountHolderName,
            bankName: account.bankName,
            ifsc: account.ifsc,
            accountNumber: '****' + account.accountNumber.slice(-4), // Masked
            verified: account.verified,
            verificationStatus: account.verificationStatus,
            isPrimary: account.isPrimary,
            linkedAt: account.createdAt
        }));

        res.json({
            success: true,
            data: {
                accounts: formattedAccounts,
                count: formattedAccounts.length
            }
        });

    } catch (error) {
        console.error('Get bank accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bank accounts'
        });
    }
};

// Remove/unlink bank account
export const removeBankAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const bankAccount = await BankAccount.findOne({
            _id: id,
            userId,
            isActive: true
        });

        if (!bankAccount) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        // Soft delete
        bankAccount.isActive = false;
        await bankAccount.save();

        // If this was primary, make another account primary
        if (bankAccount.isPrimary) {
            const nextAccount = await BankAccount.findOne({
                userId,
                isActive: true,
                _id: { $ne: id }
            });

            if (nextAccount) {
                nextAccount.isPrimary = true;
                await nextAccount.save();
            }
        }

        await AuditService.log({
            userId,
            action: 'REMOVE_BANK_ACCOUNT',
            resource: 'BankAccount',
            status: 'success',
            ipAddress: req.ip,
            metadata: {
                bankAccountId: id,
                bankName: bankAccount.bankName
            }
        });

        res.json({
            success: true,
            message: 'Bank account removed successfully'
        });

    } catch (error) {
        console.error('Remove bank account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove bank account'
        });
    }
};

// Set primary bank account
export const setPrimaryAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Remove primary from all accounts
        await BankAccount.updateMany(
            { userId, isActive: true },
            { isPrimary: false }
        );

        // Set new primary
        const bankAccount = await BankAccount.findOneAndUpdate(
            { _id: id, userId, isActive: true },
            { isPrimary: true },
            { new: true }
        );

        if (!bankAccount) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        res.json({
            success: true,
            message: 'Primary account updated successfully'
        });

    } catch (error) {
        console.error('Set primary account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update primary account'
        });
    }
};
