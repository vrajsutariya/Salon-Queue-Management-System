import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      en: {
        type: String,
        required: true,
        trim: true,
      },
      gu: {
        type: String,
        required: true,
        trim: true,
      },
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 5,
    },
    priceInr: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);
