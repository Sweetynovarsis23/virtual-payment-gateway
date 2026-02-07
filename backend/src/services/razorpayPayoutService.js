import Razorpay from 'razorpay';
import crypto from 'crypto';

class RazorpayPayoutService {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }

    /**
     * Create a contact in Razorpay
     * @param {Object} contactData - Contact information
     * @returns {Promise<Object>} Contact details
     */
    async createContact(contactData) {
        try {
            const contact = await this.razorpay.contacts.create({
                name: contactData.name,
                email: contactData.email,
                contact: contactData.phone || '9999999999',
                type: 'customer',
                reference_id: contactData.userId,
                notes: {
                    user_id: contactData.userId
                }
            });
            return contact;
        } catch (error) {
            console.error('Error creating contact:', error);
            throw new Error('Failed to create contact');
        }
    }

    /**
     * Create a fund account (bank account or UPI)
     * @param {Object} fundAccountData - Fund account information
     * @returns {Promise<Object>} Fund account details
     */
    async createFundAccount(fundAccountData) {
        try {
            const { contactId, accountType } = fundAccountData;

            let accountDetails;

            if (accountType === 'bank_account') {
                accountDetails = {
                    contact_id: contactId,
                    account_type: 'bank_account',
                    bank_account: {
                        name: fundAccountData.accountHolderName,
                        ifsc: fundAccountData.ifsc,
                        account_number: fundAccountData.accountNumber
                    }
                };
            } else if (accountType === 'vpa') {
                accountDetails = {
                    contact_id: contactId,
                    account_type: 'vpa',
                    vpa: {
                        address: fundAccountData.vpaAddress
                    }
                };
            } else {
                throw new Error('Invalid account type');
            }

            const fundAccount = await this.razorpay.fundAccount.create(accountDetails);
            return fundAccount;
        } catch (error) {
            console.error('Error creating fund account:', error);
            throw new Error('Failed to create fund account');
        }
    }

    /**
     * Create a payout
     * @param {Object} payoutData - Payout information
     * @returns {Promise<Object>} Payout details
     */
    async createPayout(payoutData) {
        try {
            const { fundAccountId, amount, currency = 'INR', mode, purpose, referenceId } = payoutData;

            // Generate unique idempotency key
            const idempotencyKey = `payout_${referenceId}_${Date.now()}`;

            const payout = await this.razorpay.payouts.create({
                account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
                fund_account_id: fundAccountId,
                amount: amount * 100, // Convert to paise
                currency: currency,
                mode: mode || 'IMPS', // IMPS, NEFT, RTGS, UPI
                purpose: purpose || 'payout',
                queue_if_low_balance: false,
                reference_id: referenceId,
                narration: `Payout from VPG - ${referenceId}`,
                notes: {
                    reference_id: referenceId
                }
            }, {
                'X-Payout-Idempotency': idempotencyKey
            });

            return payout;
        } catch (error) {
            console.error('Error creating payout:', error);
            throw new Error(error.error?.description || 'Failed to create payout');
        }
    }

    /**
     * Get payout status
     * @param {string} payoutId - Payout ID
     * @returns {Promise<Object>} Payout status
     */
    async getPayoutStatus(payoutId) {
        try {
            const payout = await this.razorpay.payouts.fetch(payoutId);
            return payout;
        } catch (error) {
            console.error('Error fetching payout status:', error);
            throw new Error('Failed to fetch payout status');
        }
    }

    /**
     * Get existing contact by reference ID
     * @param {string} referenceId - User ID
     * @returns {Promise<Object|null>} Contact or null
     */
    async getContactByReferenceId(referenceId) {
        try {
            const contacts = await this.razorpay.contacts.all({
                reference_id: referenceId
            });

            if (contacts.items && contacts.items.length > 0) {
                return contacts.items[0];
            }
            return null;
        } catch (error) {
            console.error('Error fetching contact:', error);
            return null;
        }
    }
}

export const razorpayPayoutService = new RazorpayPayoutService();
