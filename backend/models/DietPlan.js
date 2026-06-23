import mongoose from 'mongoose';

const DietPlanSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },
  beginner: { type: String, default: '' },
  intermediate: { type: String, default: '' },
  advanced: { type: String, default: '' },
  weightLoss: { type: String, default: '' },
  approved: { type: Boolean, default: true },
  fileUrl: {
    secure_url: { type: String, default: null },
    public_id: { type: String, default: null }
  }
}, { timestamps: true });

// Transform to string URL in JSON response for frontend compatibility
DietPlanSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.fileUrl && ret.fileUrl.secure_url) {
      ret.fileUrl = ret.fileUrl.secure_url;
    } else {
      ret.fileUrl = null;
    }
    return ret;
  }
});

export default mongoose.model('DietPlan', DietPlanSchema);
