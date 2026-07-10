import mongoose from 'mongoose';

mongoose.connect('mongodb://nayakparth2257_db_user:hgbpwGfDfFLcXhBE@ac-be0mjze-shard-00-00.ym4yxvw.mongodb.net:27017,ac-be0mjze-shard-00-01.ym4yxvw.mongodb.net:27017,ac-be0mjze-shard-00-02.ym4yxvw.mongodb.net:27017/nutricoach?ssl=true&replicaSet=atlas-qkb1rx-shard-0&authSource=admin&retryWrites=true&w=majority')
  .then(async () => {
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
    const client = await Client.findOne({ name: 'Divya Sharma' });
    console.log("Subscription Expiry:", client.subscriptionExpiryDate);
    const History = mongoose.model('BodyParameterHistory', new mongoose.Schema({}, { strict: false, collection: 'bodyparameterhistories' }));
    const history = await History.find({ client: client._id });
    console.log("History length:", history.length);
    if(history.length > 0) {
       console.log("Last history bodyWeight:", history[history.length - 1].bodyWeight);
    }
    process.exit(0);
  });
