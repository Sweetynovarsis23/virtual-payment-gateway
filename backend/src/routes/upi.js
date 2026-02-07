import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    linkUPI,
    getUPIs,
    removeUPI,
    setPrimaryUPI
} from '../controllers/upiController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// UPI routes
router.post('/link', linkUPI);
router.get('/', getUPIs);
router.delete('/:id', removeUPI);
router.patch('/:id/primary', setPrimaryUPI);

export default router;
