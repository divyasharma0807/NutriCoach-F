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
      { $set: { title: 'Client session' } }
    );
    console.log(`Updated ${clientRes.modifiedCount} client sessions`);

    // Update Sub Coach sessions (where organizer is senior coach, or simply where clientId is null and parentCoachId is the organizer, wait! we can just match existing titles!)
    const subCoachRes = await Session.updateMany(
      { title: { $in: ['Sub-coach Meeting', 'Coach Session'] } },
      { $set: { title: 'Sub Coach session' } }
    );
    console.log(`Updated ${subCoachRes.modifiedCount} sub-coach sessions`);

    // Update Supercoach sessions
    const superCoachRes = await Session.updateMany(
      { title: { $in: ['Super Coach Meeting', 'Parent Coach Session'] } },
      { $set: { title: 'Supercoach sessions' } }
    );
    console.log(`Updated ${superCoachRes.modifiedCount} super-coach sessions`);

    console.log('Titles updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating titles:', error);
    process.exit(1);
  }
};

updateTitles();
