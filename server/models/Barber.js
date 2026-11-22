import mongoose from 'mongoose';

const barberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    photo: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['free', 'busy', 'break'],
      default: 'free',
    },
    isOnDuty: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Barber = mongoose.model('Barber', barberSchema);
