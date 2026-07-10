import mongoose from 'mongoose';

mongoose.connect('mongodb://nayakparth2257_db_user:hgbpwGfDfFLcXhBE@ac-be0mjze-shard-00-00.ym4yxvw.mongodb.net:27017,ac-be0mjze-shard-00-01.ym4yxvw.mongodb.net:27017,ac-be0mjze-shard-00-02.ym4yxvw.mongodb.net:27017/nutricoach?ssl=true&replicaSet=atlas-qkb1rx-shard-0&authSource=admin&retryWrites=true&w=majority')
  .then(async () => {
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
    const clients = await Client.find().sort({ createdAt: -1 }).limit(3);
    for (const c of clients) {
      console.log(`Name: ${c.name}, CreatedAt: ${c.createdAt}, medicalPdf: ${c.medicalPdf ? JSON.stringify(c.medicalPdf) : 'NO'}, allergies: ${c.allergies}`);
    }
    process.exit(0);
  });
