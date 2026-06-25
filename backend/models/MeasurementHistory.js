import mongoose from 'mongoose';

const MeasurementHistorySchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  isProfileBaseline: { type: Boolean, default: false },
  belly: { type: Number },
  waist: { type: Number },
  thigh: { type: Number },
  chest: { type: Number },
  arm: { type: Number }
}, { timestamps: true });

export default mongoose.model('MeasurementHistory', MeasurementHistorySchema);
