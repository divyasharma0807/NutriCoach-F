import mongoose from 'mongoose';

mongoose.connect('mongodb://nayakparth2257_db_user:hgbpwGfDfFLcXhBE@ac-be0mjze-shard-00-00.ym4yxvw.mongodb.net:27017,ac-be0mjze-shard-00-01.ym4yxvw.mongodb.net:27017,ac-be0mjze-shard-00-02.ym4yxvw.mongodb.net:27017/nutricoach?ssl=true&replicaSet=atlas-qkb1rx-shard-0&authSource=admin&retryWrites=true&w=majority')
  .then(async () => {
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
    const client = await Client.findOne({ name: 'Divya Sharma' });
    console.log("Client medicalPdf:", JSON.stringify(client.medicalPdf, null, 2));
    console.log("Client allergies:", client.allergies);
    process.exit(0);
  });
