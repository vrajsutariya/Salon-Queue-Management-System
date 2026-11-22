import mongoose from 'mongoose';

const queueTicketSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
      },
    ],
    preferredBarber: {
      type: String, // 'any' or Barber ObjectId
      default: 'any',
    },
    assignedBarber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barber',
      default: null,
    },
    status: {
      type: String,
      enum: ['waiting', 'called', 'in-chair', 'done', 'cancelled', 'no-show'],
      default: 'waiting',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    inChairAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    estimatedWaitTimeMinutes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const QueueTicket = mongoose.model('QueueTicket', queueTicketSchema);
