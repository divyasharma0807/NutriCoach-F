import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const Coach = mongoose.model('Coach', new mongoose.Schema({}, { strict: false }));
    const coaches = await Coach.find({});
    console.log(JSON.stringify(coaches, null, 2));
    process.exit(0);
  });
