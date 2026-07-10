import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected");
    const coaches = await mongoose.model('Coach').find();
    console.log(`Found ${coaches.length} coaches.`);
    process.exit(0);
  });
