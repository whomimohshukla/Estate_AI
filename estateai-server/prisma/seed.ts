import { PrismaClient, PropertyStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const password = 'Password123';

async function upsertUser(email: string, role: 'ADMIN' | 'AGENT' | 'BUYER', firstName: string, lastName: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    update: { role, isActive: true, isEmailVerified: true },
    create: {
      email,
      passwordHash,
      role,
      firstName,
      lastName,
      isEmailVerified: true,
      phone: '9876543210',
    },
  });
}

const listings = [
  {
    title: '3BHK apartment near metro in Noida',
    description:
      'Well-lit 3BHK apartment in a gated community with gym, parking and 24x7 security. Close to the metro station, schools and shopping centres.',
    propertyType: 'APARTMENT' as const,
    purpose: 'SALE' as const,
    price: 7800000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqFt: 1450,
    amenities: ['PARKING', 'GYM', 'LIFT', 'SECURITY'],
    furnishing: 'SEMI_FURNISHED' as const,
    parking: true,
    metroDistanceKm: 0.8,
    address: 'Sector 62, Noida',
    locality: 'Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postalCode: '201301',
    latitude: 28.6252,
    longitude: 77.3712,
  },
  {
    title: '2BHK apartment with balcony in Pune',
    description:
      'Comfortable 2BHK home with a balcony, modular kitchen and covered parking in a quiet residential neighbourhood.',
    propertyType: 'APARTMENT' as const,
    purpose: 'RENT' as const,
    price: 32000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 1050,
    amenities: ['PARKING', 'BALCONY', 'LIFT'],
    furnishing: 'FURNISHED' as const,
    parking: true,
    metroDistanceKm: 2.1,
    address: 'Baner Road, Pune',
    locality: 'Baner',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411045',
    latitude: 18.559,
    longitude: 73.7797,
  },
  {
    title: 'Independent villa with garden in Bengaluru',
    description:
      'Spacious independent villa with a private garden, two covered parking spots and proximity to international schools.',
    propertyType: 'VILLA' as const,
    purpose: 'SALE' as const,
    price: 18500000,
    bedrooms: 4,
    bathrooms: 4,
    areaSqFt: 3200,
    amenities: ['PARKING', 'GARDEN', 'SWIMMING_POOL', 'SECURITY'],
    furnishing: 'UNFURNISHED' as const,
    parking: true,
    metroDistanceKm: 1.4,
    address: 'Whitefield, Bengaluru',
    locality: 'Whitefield',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560066',
    latitude: 12.9698,
    longitude: 77.75,
  },
  {
    title: 'Compact 1BHK near IT park in Hyderabad',
    description:
      'Affordable 1BHK apartment with gym and security, suitable for working professionals near the IT park.',
    propertyType: 'APARTMENT' as const,
    purpose: 'RENT' as const,
    price: 18500,
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 620,
    amenities: ['GYM', 'SECURITY', 'LIFT'],
    furnishing: 'SEMI_FURNISHED' as const,
    parking: false,
    metroDistanceKm: 1.1,
    address: 'Gachibowli, Hyderabad',
    locality: 'Gachibowli',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500032',
    latitude: 17.4399,
    longitude: 78.3489,
  },
];

async function main(): Promise<void> {
  const admin = await upsertUser('admin@estateai.local', 'ADMIN', 'Aarav', 'Sharma');
  const agent = await upsertUser('agent@estateai.local', 'AGENT', 'Riya', 'Mehta');
  const buyer = await upsertUser('buyer@estateai.local', 'BUYER', 'Kabir', 'Joshi');

  const count = await prisma.property.count();
  if (count === 0) {
    for (const listing of listings) {
      await prisma.property.create({
        data: {
          ...listing,
          agentId: agent.id,
          status: PropertyStatus.AVAILABLE,
          publishedAt: new Date(),
          images: {
            create: [
              {
                url: 'https://placehold.co/1200x800/png?text=EstateAI',
                altText: listing.title,
                position: 0,
                isCover: true,
              },
            ],
          },
        },
      });
    }
  }

  console.log('Seed complete', {
    credentials: { admin: admin.email, agent: agent.email, buyer: buyer.email, password },
    properties: await prisma.property.count(),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
