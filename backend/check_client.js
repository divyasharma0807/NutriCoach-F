import mongoose from 'mongoose';

mongoose.connect('mongodb://nayakparth2257_db_user:hgbpwGfDfFLcXhBE@ac-be0mjze-shard-00-00.ym4yxvw.mongodb.net:27017,ac-be0mjze-shard-00-01.ym4yxvw.mongodb.net:27017,ac-be0mjze-shard-00-02.ym4yxvw.mongodb.net:27017/nutricoach?ssl=true&replicaSet=atlas-qkb1rx-shard-0&authSource=admin&retryWrites=true&w=majority')
  .then(async () => {
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
    const client = await Client.findById('6a50dd943f3fe876755a7ee0');
    console.log("Client ID 6a50dd943f3fe876755a7ee0:");
    console.log("Name:", client?.name);
    console.log("MedicalPdf:", client?.medicalPdf);
    console.log("Allergies:", client?.allergies);
    process.exit(0);
  });
