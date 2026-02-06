# Virtual Payment Gateway - Government Treasury Platform

<div align="center">

![VPG Logo](https://img.shields.io/badge/VPG-Government%20Platform-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Production%20Ready-success?style=for-the-badge)

**A secure, government-grade virtual payment gateway with comprehensive treasury management**

[Features](#features) • [Quick Start](#quick-start) • [API Docs](#api-documentation) • [Demo](#demo)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Admin Panel](#admin-panel)
- [Security](#security)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

The **Virtual Payment Gateway (VPG)** is a comprehensive financial platform designed for government institutions to manage digital payments, tax collections, and treasury operations. Built with the MERN stack, it provides a secure, scalable solution for handling financial transactions with complete audit trails and administrative oversight.

### Who Is This For?

- **Government Agencies** - Treasury departments managing public funds
- **Financial Institutions** - Organizations requiring secure payment processing
- **Tax Authorities** - Entities collecting and managing tax payments
- **Public Sector** - Any organization needing transparent financial operations

---

## ✨ Key Features

### 💰 User Features

- **Virtual Wallet System** - Each user gets a unique virtual account number
- **Pay-in Transactions** - Add money to wallet (simulated bank transfers)
- **Payout Transactions** - Send money from wallet to external accounts
- **Tax Payments** - Direct tax payment to government treasury
- **Transaction History** - Complete audit trail with filtering
- **Real-time Balance** - Live wallet balance updates
- **Transaction Receipts** - Unique transaction IDs for all operations

### 🛡️ Admin Features

- **Dashboard Analytics** - Real-time statistics and metrics
- **User Management** - View and manage all registered users
- **Transaction Monitoring** - Track all system transactions with filters
- **Treasury Overview** - Monitor government tax collections
- **Audit Logs** - Complete system activity logging
- **Role-based Access** - Secure admin-only sections

### 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Encryption** - Bcrypt hashing (10 rounds)
- **Sensitive Data Vault** - Encrypted storage for sensitive information
- **Rate Limiting** - Protection against brute-force attacks
- **Audit Logging** - Track all user actions with IP addresses
- **Role-based Authorization** - Admin vs. user permissions

---

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (MongoDB Atlas)
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Crypto** - Data encryption

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Icons** - Professional icon library
- **Vite** - Build tool and dev server

### Development
- **Nodemon** - Auto-restart server
- **Morgan** - HTTP request logger
- **CORS** - Cross-origin resource sharing
- **ESLint** - Code quality

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│                   React SPA + Vite                          │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/REST API
┌────────────────────▼────────────────────────────────────────┐
│                   Express.js Server                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth Routes │  │Gateway Routes│  │ Admin Routes │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │           Middleware Layer                          │    │
│  │  Authentication │ Validation │ Rate Limiting        │    │
│  └──────────────────────────────────────────────────────┘    │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │          Business Logic Services                    │    │
│  │  Wallet │ Gateway │ Treasury │ Audit                │    │
│  └──────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   MongoDB Atlas                              │
│  Collections: users, wallets, transactions, treasury, logs   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org))
- **MongoDB Atlas** account ([Sign up](https://www.mongodb.com/cloud/atlas))
- **Git** ([Download](https://git-scm.com))

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd VPG
```

### Step 2: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 3: Environment Configuration

Create `.env` file in `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/vpg_demo

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Step 4: Database Setup

The application will automatically:
- Connect to MongoDB Atlas
- Create required collections
- Initialize treasury account

No manual database setup required!

---

## ⚙️ Configuration

### MongoDB Atlas Setup

1. **Create Cluster**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free M0 cluster
   - Choose your preferred cloud provider

2. **Network Access**
   - Whitelist IP: `0.0.0.0/0` (for development)
   - For production: Use specific IP addresses

3. **Database User**
   - Create user with read/write permissions
   - Note down username and password

4. **Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<username>`, `<password>`, and database name

### Frontend Configuration

Update `frontend/src/services/api.js` if needed:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

---

## 🎮 Usage

### Starting the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access Application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

### Creating Your First Account

1. Navigate to http://localhost:5173
2. Click **"Register here"**
3. Enter email and password (min 6 characters)
4. Click **"Register"**
5. You'll be automatically logged in!

### Making Transactions

**Add Money (Pay-in):**
1. Go to "Add Money" from sidebar
2. Enter amount
3. Click "Add Money"
4. View updated balance

**Send Money (Payout):**
1. Go to "Send Money"
2. Enter recipient account and amount
3. Click "Send Money"

**Pay Tax:**
1. Go to "Pay Tax"
2. Enter tax amount
3. Click "Pay Tax"
4. Receive unique receipt ID

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication

**POST /api/auth/register**
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": "...", "email": "...", "role": "user" },
    "wallet": { "virtualAccountNo": "VPN...", "balance": 0 }
  }
}
```

**POST /api/auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": "...", "email": "...", "role": "user" }
  }
}
```

#### Gateway Operations

**POST /api/gateway/payin**
```json
Request:
{
  "amount": 1000,
  "sourceAccount": "BANK123"
}

Response:
{
  "success": true,
  "data": {
    "transaction": {
      "txnId": "TXN...",
      "amount": 1000,
      "type": "PAYIN",
      "status": "SUCCESS"
    },
    "newBalance": 1000
  }
}
```

**POST /api/gateway/payout**
```json
Request:
{
  "amount": 500,
  "destinationAccount": "ACC456"
}
```

**POST /api/gateway/pay-tax**
```json
Request:
{
  "amount": 100
}

Response:
{
  "success": true,
  "data": {
    "transaction": { ... },
    "receiptId": "RCT...",
    "newBalance": 400
  }
}
```

#### Admin Endpoints

**GET /api/admin/stats**
```json
Response:
{
  "success": true,
  "data": {
    "totalUsers": 25,
    "totalPayin": 50000,
    "totalPayout": 20000,
    "treasuryBalance": 3000,
    "pendingTransactions": 2,
    "totalTaxCollected": 3000
  }
}
```

**GET /api/admin/users**
```json
Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "...",
        "email": "user@example.com",
        "wallet": { "virtualAccountNo": "...", "balance": 1000 },
        "createdAt": "2024-01-01T..."
      }
    ]
  }
}
```

**GET /api/admin/transactions?type=PAYIN&status=SUCCESS**

Query Parameters:
- `type`: PAYIN, PAYOUT, TAX
- `status`: SUCCESS, FAILED, PENDING
- `limit`: Number of results (default: 50)

---

## 🔐 Admin Panel

### Creating Admin User

**Option 1: Database Direct**
```javascript
// In MongoDB Compass or Shell
db.users.updateOne(
  { email: "admin@vpg.com" },
  { $set: { role: "admin" } }
)
```

**Option 2: Register then Update**
1. Register normal account
2. Update role in database
3. Logout and login again

### Admin Features

- **Dashboard** - System statistics and metrics
- **User Management** - View all users and wallets
- **Transaction Monitoring** - Filter and search transactions
- **Treasury** - View tax collections and balance
- **Audit Logs** - Complete system activity log

---

## 🔒 Security

### Best Practices Implemented

✅ **Password Security**
- Bcrypt hashing with 10 salt rounds
- Minimum 6 character requirement
- Never stored in plain text

✅ **Token Management**
- JWT tokens with 24-hour expiration
- Secure HTTP-only recommended for production
- Token verification on every request

✅ **Rate Limiting**
- 5 requests per 15 minutes on auth endpoints
- 100 requests per 15 minutes on general API
- IP-based tracking

✅ **Data Encryption**
- Sensitive data encrypted in vault
- AES-256-CBC encryption
- Environment variable encryption keys

✅ **Audit Logging**
- Every action logged with timestamp
- IP address tracking
- User identification

### Production Recommendations

1. **Environment Variables**
   - Use strong, random JWT secrets
   - Rotate encryption keys regularly
   - Never commit `.env` to version control

2. **HTTPS**
   - Always use HTTPS in production
   - Implement SSL/TLS certificates
   - Redirect HTTP to HTTPS

3. **Database**
   - Enable MongoDB authentication
   - Use specific IP whitelisting
   - Regular backups
   - Enable encryption at rest

4. **Rate Limiting**
   - Adjust limits based on traffic
   - Implement IP banning for abuse
   - Use Redis for distributed rate limiting

---

## 🚢 Deployment

### Backend Deployment (Railway/Render)

1. **Prepare for Production**
```javascript
// Update backend/src/config/env.js
nodeEnv: process.env.NODE_ENV || 'production'
```

2. **Set Environment Variables**
```
PORT=5000
NODE_ENV=production
MONGODB_URI=<your-atlas-uri>
JWT_SECRET=<strong-secret>
ENCRYPTION_KEY=<32-char-key>
FRONTEND_URL=<your-frontend-url>
```

3. **Deploy to Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Frontend Deployment (Vercel/Netlify)

1. **Build Optimization**
```bash
cd frontend
npm run build
```

2. **Configure API Base URL**
```javascript
// frontend/src/services/api.js
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-backend-url.com/api'
  : 'http://localhost:5000/api';
```

3. **Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Database (MongoDB Atlas)

- Already cloud-hosted
- Enable backups
- Set up monitoring
- Configure alerts

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
```
Error: EADDRINUSE :::5000
Solution: Kill process on port 5000 or change PORT in .env
```

**MongoDB connection failed**
```
Error: MongoNetworkError
Solutions:
1. Check MongoDB connection string
2. Verify network access (whitelist IP)
3. Confirm database user credentials
```

**Rate limit errors**
```
Error: Too many requests
Solutions:
1. Wait 15 minutes
2. Comment out rate limiters temporarily (development only)
3. Restart backend to clear cache
```

**Admin features not showing**
```
Issue: User role is not 'admin'
Solution: Update role in database (see Admin Panel section)
```

---

## 📄 License

MIT License - feel free to use for commercial or personal projects

---

## 📞 Support

**Issues & Questions:**
- Create issue on GitHub
- Email: support@vpg.com
- Documentation: See `/docs` folder

---

<div align="center">

**Built with ❤️ for Government Financial Systems**

[⬆ Back to Top](#virtual-payment-gateway---government-treasury-platform)

</div>
