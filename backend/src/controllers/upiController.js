import UPI from '../models/UPI.js';
import { AuditService } from '../services/auditService.js';

// Razorpay configuration
const razorpayAuth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
).toString('base64');

// UPI format validation
const validateUPIFormat = (vpa) => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return upiRegex.test(vpa);
};

// Link UPI with Razorpay VPA validation
export const linkUPI = async (req, res) => {
    try {
        const { vpaAddress } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!vpaAddress) {
            return res.status(400).json({
                success: false,
                message: 'VPA address is required'
            });
        }

        // Validate UPI format
        if (!validateUPIFormat(vpaAddress)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid UPI ID format. Use format: username@provider'
            });
        }

        // Check if UPI already exists (including soft-deleted)
        const existingUPI = await UPI.findOne({
            userId,
            vpaAddress: vpaAddress.toLowerCase(),
            isActive: true
        });

        if (existingUPI) {
            return res.status(400).json({
                success: false,
                message: 'This UPI ID is already linked to your account'
            });
        }

        // Razorpay VPA Validation
        let verificationId = null;
        let verificationStatus = 'pending';
        let holderName = null;

        try {
            console.log('🔐 Initiating Razorpay VPA validation...');

            if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
                // Step 1: Create Contact
                console.log('Step 1/3: Creating contact...');
                const contactResponse = await fetch('https://api.razorpay.com/v1/contacts', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${razorpayAuth}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: req.user.name || 'User',
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

                // Step 2: Create Fund Account with VPA
                console.log('Step 2/3: Creating VPA fund account...');
                const fundAccountResponse = await fetch('https://api.razorpay.com/v1/fund_accounts', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${razorpayAuth}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contact_id: contact.id,
                        account_type: 'vpa',
                        vpa: {
                            address: vpaAddress.toLowerCase()
                        }
                    })
                });

                if (!fundAccountResponse.ok) {
                    const errorData = await fundAccountResponse.json();
                    throw new Error(`VPA fund account creation failed: ${errorData.error?.description || 'Unknown error'}`);
                }

                const fundAccount = await fundAccountResponse.json();
                console.log('✅ VPA fund account created:', fundAccount.id);

                // Step 3: Create VPA Validation
                console.log('Step 3/3: Initiating VPA validation...');
                const validationResponse = await fetch('https://api.razorpay.com/v1/fund_accounts/validations', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${razorpayAuth}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fund_account: {
                            id: fundAccount.id
                        },
                        amount: 100, // ₹1.00 in paise
                        currency: 'INR',
                        notes: {
                            purpose: 'UPI verification for VPG'
                        }
                    })
                });

                if (!validationResponse.ok) {
                    const errorData = await validationResponse.json();
                    throw new Error(`VPA validation failed: ${errorData.error?.description || 'Unknown error'}`);
                }

                const validation = await validationResponse.json();
                console.log('✅ VPA validation initiated:', validation.id);
                console.log('Validation status:', validation.status);

                verificationId = validation.id;
                verificationStatus = validation.status === 'completed' ? 'completed' : 'pending';

                // Get holder name if available
                if (validation.results && validation.results.registered_name) {
                    holderName = validation.results.registered_name;
                }

                console.log('🎉 Razorpay VPA validation completed!');
            } else {
                console.log('ℹ️  No Razorpay keys - marking as pending');
                verificationStatus = 'pending';
            }

        } catch (razorpayError) {
            console.error('❌ Razorpay VPA validation error:', razorpayError.message);
            console.error('Details:', razorpayError);
            // Continue with pending status if Razorpay fails
            verificationStatus = 'pending';
        }

        // Save to database
        const upi = await UPI.create({
            userId,
            vpaAddress: vpaAddress.toLowerCase(),
            holderName,
            verified: verificationStatus === 'completed',
            verificationId,
            verificationStatus,
            verifiedAt: verificationStatus === 'completed' ? new Date() : null,
            // Set as primary if this is the first UPI
            isPrimary: await UPI.countDocuments({ userId, isActive: true }) === 0
        });

        // Audit log
        await AuditService.log({
            userId,
            action: 'UPI_LINKED',
            resource: 'UPI',
            resourceId: upi._id,
            details: {
                vpaAddress: vpaAddress.toLowerCase(),
                verificationStatus
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json({
            success: true,
            message: verificationStatus === 'completed'
                ? 'UPI linked and verified successfully!'
                : 'UPI linked successfully (verification pending)',
            data: {
                upi: {
                    id: upi._id,
                    vpaAddress: upi.vpaAddress,
                    holderName: upi.holderName,
                    verified: upi.verified,
                    verificationStatus: upi.verificationStatus,
                    isPrimary: upi.isPrimary,
                    createdAt: upi.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Link UPI error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to link UPI'
        });
    }
};

// Get all UPIs for user
export const getUPIs = async (req, res) => {
    try {
        const userId = req.user._id;

        const upis = await UPI.find({ userId, isActive: true })
            .sort({ isPrimary: -1, createdAt: -1 });

        res.json({
            success: true,
            data: {
                upis: upis.map(upi => ({
                    id: upi._id,
                    vpaAddress: upi.vpaAddress,
                    holderName: upi.holderName,
                    verified: upi.verified,
                    verificationStatus: upi.verificationStatus,
                    isPrimary: upi.isPrimary,
                    createdAt: upi.createdAt
                }))
            }
        });

    } catch (error) {
        console.error('Get UPIs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch UPI IDs'
        });
    }
};

// Remove UPI (soft delete)
export const removeUPI = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const upi = await UPI.findOne({ _id: id, userId, isActive: true });

        if (!upi) {
            return res.status(404).json({
                success: false,
                message: 'UPI not found'
            });
        }

        // Soft delete
        upi.isActive = false;
        await upi.save();

        // If this was primary, set another as primary
        if (upi.isPrimary) {
            const nextUPI = await UPI.findOne({ userId, isActive: true });
            if (nextUPI) {
                nextUPI.isPrimary = true;
                await nextUPI.save();
            }
        }

        // Audit log
        await AuditService.log({
            userId,
            action: 'UPI_REMOVED',
            resource: 'UPI',
            resourceId: upi._id,
            details: {
                vpaAddress: upi.vpaAddress
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            message: 'UPI removed successfully'
        });

    } catch (error) {
        console.error('Remove UPI error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove UPI'
        });
    }
};

// Set primary UPI
export const setPrimaryUPI = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const upi = await UPI.findOne({ _id: id, userId, isActive: true });

        if (!upi) {
            return res.status(404).json({
                success: false,
                message: 'UPI not found'
            });
        }

        // Unset current primary
        await UPI.updateMany(
            { userId, isActive: true },
            { isPrimary: false }
        );

        // Set new primary
        upi.isPrimary = true;
        await upi.save();

        // Audit log
        await AuditService.log({
            userId,
            action: 'UPI_PRIMARY_SET',
            resource: 'UPI',
            resourceId: upi._id,
            details: {
                vpaAddress: upi.vpaAddress
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            message: 'Primary UPI updated successfully'
        });

    } catch (error) {
        console.error('Set primary UPI error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set primary UPI'
        });
    }
};
