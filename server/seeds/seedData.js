import { Barber, Service } from '../models/index.js';

export const seedDatabase = async () => {
  try {
    // 1. Seed Barbers if not present
    const barberCount = await Barber.countDocuments();
    if (barberCount === 0) {
      console.log('[Seed] Seeding default barbers: Ravi, Amit, Imran...');
      await Barber.create([
        {
          name: 'Ravi',
          photo: 'Ravi',
          status: 'busy',
          isOnDuty: true,
        },
        {
          name: 'Amit',
          photo: 'Amit',
          status: 'free',
          isOnDuty: true,
        },
        {
          name: 'Imran',
          photo: 'Imran',
          status: 'break',
          isOnDuty: true,
        },
      ]);
      console.log('[Seed] Barbers seeded successfully.');
    }

    // 2. Seed Services if not present
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      console.log('[Seed] Seeding default services...');
      await Service.create([
        {
          name: {
            en: 'Haircut',
            gu: 'હેરકટ (વાળ કાપવા)',
          },
          durationMinutes: 30,
          priceInr: 150,
          isActive: true,
        },
        {
          name: {
            en: 'Beard Trim',
            gu: 'દાઢી ટ્રીમ (બીઅર્ડ)',
          },
          durationMinutes: 15,
          priceInr: 80,
          isActive: true,
        },
        {
          name: {
            en: 'Hair Spa',
            gu: 'હેર સ્પા',
          },
          durationMinutes: 45,
          priceInr: 400,
          isActive: true,
        },
        {
          name: {
            en: 'Head Massage',
            gu: 'હેડ મસાજ (માલિશ)',
          },
          durationMinutes: 20,
          priceInr: 150,
          isActive: true,
        },
      ]);
      console.log('[Seed] Services seeded successfully.');
    }
  } catch (error) {
    console.error('[Seed] Error seeding database:', error.message);
  }
};
