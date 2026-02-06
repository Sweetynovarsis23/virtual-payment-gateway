import { Treasury } from '../models/Treasury.js';

/**
 * Treasury Service - Manages government treasury operations
 */
export class TreasuryService {
    /**
     * Initialize treasury account (run once)
     */
    static async initializeTreasury() {
        try {
            const existing = await Treasury.findOne({ accountType: 'TREASURY_MASTER' });

            if (!existing) {
                const treasury = new Treasury({
                    accountType: 'TREASURY_MASTER',
                    balance: 0,
                    totalCollected: 0
                });
                await treasury.save();
                console.log('✅ Treasury account initialized');
            }
        } catch (error) {
            console.error('Error initializing treasury:', error);
        }
    }

    /**
     * Add funds to treasury (tax collection)
     * @param {number} amount - Amount to add
     * @returns {object} - Updated treasury
     */
    static async addFunds(amount) {
        try {
            const treasury = await Treasury.findOne({ accountType: 'TREASURY_MASTER' });

            if (!treasury) {
                throw new Error('Treasury not initialized');
            }

            treasury.balance += amount;
            treasury.totalCollected += amount;
            treasury.lastTransaction = new Date();

            await treasury.save();
            return treasury;
        } catch (error) {
            console.error('Error adding funds to treasury:', error);
            throw error;
        }
    }

    /**
     * Get treasury balance and stats
     * @returns {object} - Treasury data
     */
    static async getTreasuryStats() {
        try {
            return await Treasury.findOne({ accountType: 'TREASURY_MASTER' });
        } catch (error) {
            console.error('Error fetching treasury stats:', error);
            throw error;
        }
    }
}
