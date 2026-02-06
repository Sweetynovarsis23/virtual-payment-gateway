import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { WalletService } from '../services/walletService.js';
import { AuditService } from '../services/auditService.js';
import { config } from '../config/env.js';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', /* authLimiter, */ validate('register'), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            email,
            passwordHash,
            role: 'user'
        });

        await user.save();

        // Create wallet for user
        const wallet = await WalletService.createWallet(user._id);

        // Log audit
        await AuditService.log({
            userId: user._id,
            action: 'USER_REGISTERED',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role
                },
                wallet: {
                    virtualAccountNo: wallet.virtualAccountNo,
                    balance: wallet.balance
                }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', /* authLimiter, */ validate('login'), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            await AuditService.log({
                action: 'LOGIN_FAILED',
                status: 'failed',
                ipAddress: req.ip,
                metadata: { email, reason: 'User not found' }
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            await AuditService.log({
                userId: user._id,
                action: 'LOGIN_FAILED',
                status: 'failed',
                ipAddress: req.ip,
                metadata: { reason: 'Invalid password' }
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Log successful login
        await AuditService.log({
            userId: user._id,
            action: 'USER_LOGIN',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

/**
 * GET /api/auth/profile
 * Get user profile
 */
router.get('/profile', authenticate, async (req, res) => {
    try {
        const wallet = await WalletService.getWallet(req.user._id);

        res.json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    email: req.user.email,
                    role: req.user.role
                },
                wallet: wallet ? {
                    virtualAccountNo: wallet.virtualAccountNo,
                    balance: wallet.balance,
                    status: wallet.status
                } : null
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

export default router;
