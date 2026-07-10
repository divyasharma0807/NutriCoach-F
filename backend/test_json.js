import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Client from './models/Client.js';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const client = await Client.findOne();
    const json = JSON.stringify(client);
    console.log(json);
    process.exit(0);
  });
