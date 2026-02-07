import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    linkBankAccount,
    getBankAccounts,
    removeBankAccount,
    setPrimaryAccount
} from '../controllers/bankAccountController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Link new bank account
router.post('/link', linkBankAccount);

// Get all linked bank accounts
router.get('/', getBankAccounts);

// Remove bank account
router.delete('/:id', removeBankAccount);

// Set primary bank account
router.patch('/:id/primary', setPrimaryAccount);

export default router;
