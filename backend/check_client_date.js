import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
    const c = await Client.findOne();
    console.log(`Updated at: ${c.updatedAt}`);
    process.exit(0);
  });
