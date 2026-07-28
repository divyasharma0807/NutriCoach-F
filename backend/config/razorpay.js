import Razorpay from 'razorpay';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const requiredEnvVars = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET'
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  const errorMsg = `CRITICAL CONFIGURATION ERROR: Missing required environment variable(s) for Razorpay: ${missingVars.join(', ')}. Please add them to your .env file to start the server.`;
  console.error('\x1b[31m%s\x1b[0m', errorMsg);
  throw new Error(errorMsg);
}

// Initialize Razorpay SDK
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
