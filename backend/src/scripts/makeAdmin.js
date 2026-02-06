import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

const makeAdmin = async (email) => {
    try {
        // Connect to database
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find and update user
        const user = await User.findOneAndUpdate(
            { email: email },
            { role: 'admin' },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            console.log(`❌ User with email ${email} not found`);
            console.log('Please register this user first, then run this script again.');
        } else {
            console.log('✅ User updated to admin successfully!');
            console.log('User:', user.email);
            console.log('Role:', user.role);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

// Run the script
const email = process.argv[2] || 'sweety.mahale@novarsistech.com';
console.log(`Making ${email} an admin...`);
makeAdmin(email);
