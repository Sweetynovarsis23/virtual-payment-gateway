# Virtual Payment Gateway - Backend

Professional-grade Virtual Payment Gateway API demonstrating fintech capability for government project evaluation.

## Features

- ✅ **Virtual Gateway Engine** - Simulated payment processing
- ✅ **Wallet Management** - Preloaded wallet system with virtual accounts
- ✅ **Government Treasury** - Separate ledger for tax collections
- ✅ **Security Vault** - AES-256 encryption for sensitive data
- ✅ **Audit Logging** - Complete action tracking
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Rate Limiting** - DDoS protection
- ✅ **Input Validation** - Comprehensive request validation

## Tech Stack

- Node.js + Express.js
- MongoDB (Mongoose ODM)
- JWT for authentication
- Bcrypt for password hashing
- AES-256-CBC for encryption

## Installation

### Prerequisites

- Node.js v18 or higher
- MongoDB running locally or connection URI

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Edit .env file with your settings
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vpg_demo
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=64-character-hex-string
```

3. Start MongoDB (if running locally):
```bash
mongod
```

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Gateway Operations
- `POST /api/gateway/payin` - Process pay-in
- `POST /api/gateway/payout` - Process payout
- `POST /api/gateway/pay-tax` - Pay government tax
- `GET /api/gateway/status/:txnId` - Transaction status
- `GET /api/gateway/verify/:txnId` - Verify transaction

### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/history` - Transaction history
- `GET /api/wallet/virtual-account` - Virtual account details

### Admin (Requires admin role)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - All users
- `GET /api/admin/transactions` - All transactions
- `GET /api/admin/treasury` - Treasury details
- `GET /api/admin/audit-logs` - Audit logs

## Security Features

1. **Password Hashing** - Bcrypt with 10 salt rounds
2. **JWT Tokens** - 24-hour expiry
3. **Rate Limiting** - Prevents brute force attacks
4. **Input Validation** - Joi schema validation
5. **AES Encryption** - Vault for sensitive data
6. **Audit Logging** - Track all actions with IP and user agent

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Mongoose models
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── server.js        # Entry point
├── package.json
└── .env
```

## Database Collections

1. **users** - User accounts
2. **wallets** - User wallets with virtual accounts
3. **transactions** - Complete transaction ledger
4. **treasuries** - Government treasury account
5. **auditlogs** - Audit trail

## Creating Admin User

After registration, manually update a user in MongoDB:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Testing

Use tools like Postman or Thunder Client to test the API.

Example request:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Pay-in (use token from login)
curl -X POST http://localhost:5000/api/gateway/payin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount":5000}'
```

## License

ISC
