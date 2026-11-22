import mongoose from 'mongoose';

const salonSettingSchema = new mongoose.Schema(
  {
    isQueueOpen: {
      type: Boolean,
      default: true,
    },
    adminPin: {
      type: String,
      default: '1234',
    },
    closingTime: {
      type: String,
      default: '9:00 PM',
    },
    announcement: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

/**
 * Singleton helper to get or create the global salon settings
 */
salonSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      isQueueOpen: true,
      adminPin: '1234',
      closingTime: '9:00 PM',
    });
  }
  return settings;
};

export const SalonSetting = mongoose.model('SalonSetting', salonSettingSchema);
