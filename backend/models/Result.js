import mongoose from 'mongoose';

const ResultSchema = new mongoose.Schema({
  coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },
  clientName: { type: String, required: true },
  description: { type: String, required: true },
  image: {
    secure_url: { type: String, required: true },
    public_id: { type: String, required: true }
  }
}, { timestamps: true });

// Transform to string URL in JSON response for frontend compatibility
ResultSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.image && ret.image.secure_url) {
      ret.image = ret.image.secure_url;
    }
    return ret;
  }
});

export default mongoose.model('Result', ResultSchema);
