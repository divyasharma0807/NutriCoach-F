import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Session from './models/Session.js';

dotenv.config();

const updateTitles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Update Client sessions
    const clientRes = await Session.updateMany(
      { clientId: { $ne: null } },
      { $set: { title: 'Client Session' } }
    );
    console.log(`Updated ${clientRes.modifiedCount} client sessions`);

    // Update Coach sessions (Sub Coach session, Supercoach sessions, Sub-coach Meeting, Super Coach Meeting, Coach Session)
    const coachRes = await Session.updateMany(
      { clientId: null },
      { $set: { title: 'Coach Session' } }
    );
    console.log(`Updated ${coachRes.modifiedCount} coach sessions`);

    console.log('Titles updated successfully to Client Session and Coach Session');
    process.exit(0);
  } catch (error) {
    console.error('Error updating titles:', error);
    process.exit(1);
  }
};

updateTitles();
