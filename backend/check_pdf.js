import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
    const clients = await Client.find({});
    clients.forEach(c => {
      console.log(`Client: ${c.name}`);
      console.log(`Medical PDF:`, c.medicalPdf);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
