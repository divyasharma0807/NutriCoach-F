import mongoose from 'mongoose';

const BodyParameterHistorySchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  isProfileBaseline: { type: Boolean, default: false },
  bodyWeight: { type: Number },
  bmi: { type: Number },
  bodyFatRatio: { type: Number },
  muscleRate: { type: Number },
  bodyWater: { type: Number },
  boneMass: { type: Number },
  bmr: { type: Number },
  metabolicAge: { type: Number },
  visceralFat: { type: Number },
  subcutaneousFat: { type: Number },
  proteinMass: { type: Number },
  muscleMass: { type: Number },
  weightWithoutFat: { type: Number }
}, { timestamps: true });

export default mongoose.model('BodyParameterHistory', BodyParameterHistorySchema);
