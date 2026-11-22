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
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          status: 'busy',
          isOnDuty: true,
        },
        {
          name: 'Amit',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          status: 'free',
          isOnDuty: true,
        },
        {
          name: 'Imran',
          photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
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
