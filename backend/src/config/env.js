import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://sweetymahale23:sweetymahale23@cluster0.wpvjs.mongodb.net',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
  encryptionKey: process.env.ENCRYPTION_KEY,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
