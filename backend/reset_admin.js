import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

dotenv.config();

async function run() {
  const phone = '8823852040';
  const password = 'Parth@2257';

  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // Find and update if exists, otherwise create
    let admin = await Admin.findOne({ phone });
    if (admin) {
      admin.password = password;
      await admin.save();
      console.log(`Successfully updated existing admin password for phone: ${phone}`);
    } else {
      // Clear any other admins to ensure clean state
      await Admin.deleteMany({});
      admin = await Admin.create({
        name: 'System Admin',
        phone,
        password,
        role: 'admin'
      });
      console.log(`Successfully created new admin with phone: ${phone} and password: ${password}`);
    }
  } catch (error) {
    console.error('Error executing admin reset:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
