import { generateText, geminiEnabled } from '../../../config/gemini.js';
import { prisma } from '../../../config/database.js';
import { logger } from '../../../config/logger.js';
import { NotFoundError } from '../../../utils/AppError.js';
import { propertiesService, type Viewer } from '../../properties/properties.service.js';
import type { PropertyDto } from '../../properties/properties.types.js';
import type { ChatInput } from './chat.schema.js';

const SYSTEM_INSTRUCTION = [
  'You are a property assistant. Answer using only the verified property context provided.',
  'If the answer is not present in the context, say: "That information is not provided for this listing."',
  'Never invent amenities, distances, prices, specifications or availability.',
  'Perform no calculations except simple price per square foot if the exact values are in the context.',
  'Keep answers under 120 words.',
].join(' ');

function propertyContext(property: PropertyDto): string {
  return [
    `Title: ${property.title}`,
    `Status: ${property.status}`,
    `Purpose: ${property.purpose}`,
    `Property type: ${property.propertyType}`,
    `Price INR: ${property.price}`,
    `Price per sq ft: ${property.pricePerSqFt}`,
    `Bedrooms: ${property.bedrooms}`,
    `Bathrooms: ${property.bathrooms}`,
    `Area sq ft: ${property.areaSqFt}`,
    `Amenities: ${property.amenities.join(', ') || 'none supplied'}`,
    `Furnishing: ${property.furnishing}`,
    `Parking: ${property.parking ? 'yes' : 'no'}`,
    `Verified metro distance km: ${property.metroDistanceKm ?? 'not supplied'}`,
    `Address: ${property.address}, ${property.locality}, ${property.city}, ${property.state} ${property.postalCode}`,
  ].join('\n');
}

function fallbackAnswer(message: string, property: PropertyDto | null): string {
  if (!property) return 'Please select a property so I can answer from verified listing information.';
  const question = message.toLowerCase();

  if (/price|cost|budget|how much/.test(question)) {
    return `The listed price is INR ${property.price} for ${property.purpose.toLowerCase()}.`;
  }
  if (/area|size|square|sqft|sq ft|carpet/.test(question)) {
    return `The listed area is ${property.areaSqFt} sq ft, which works out to INR ${property.pricePerSqFt} per sq ft.`;
  }
  if (/bedroom|bathroom|bhk/.test(question)) {
    return `This property has ${property.bedrooms} bedrooms and ${property.bathrooms} bathrooms.`;
  }
  if (/metro|distance|near/.test(question)) {
    return property.metroDistanceKm !== null
      ? `The verified metro distance is ${property.metroDistanceKm} km.`
      : 'That information is not provided for this listing.';
  }
  if (/furnish/.test(question)) {
    return `The furnishing status is ${property.furnishing.toLowerCase()}.`;
  }
  if (/parking|gym|amenity|amenities|pool|lift|security/.test(question)) {
    const matches = property.amenities.filter((amenity) =>
      question.includes(amenity.toLowerCase()) || question.includes(amenity.toLowerCase().replace('_', ' ')),
    );
    return matches.length > 0
      ? `Yes, the supplied amenities include ${matches.join(', ')}.`
      : `That information is not provided for this listing. Supplied amenities: ${property.amenities.join(', ') || 'none'}.`;
  }
  if (/address|location|where|city/.test(question)) {
    return `It is in ${property.locality}, ${property.city}, ${property.state}.`;
  }

  return `${property.title} is a ${property.propertyType.toLowerCase()} in ${property.locality}, ${property.city} with ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms and ${property.areaSqFt} sq ft, listed at INR ${property.price}.`;
}

function containsUnverifiedNumber(answer: string, property: PropertyDto | null, message: string): boolean {
  const allowed = new Set(
    [
      message,
      property ? String(property.price) : '',
      property ? String(property.pricePerSqFt) : '',
      property ? String(property.bedrooms) : '',
      property ? String(property.bathrooms) : '',
      property ? String(property.areaSqFt) : '',
      property?.metroDistanceKm === null || property === null ? '' : String(property.metroDistanceKm),
    ]
      .join(' ')
      .match(/\b\d+(?:\.\d+)?\b/g) ?? [],
  );

  const numbers = answer.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  return numbers.some((number) => !allowed.has(number));
}

export const chatService = {
  async chat(userId: string, viewer: Viewer, input: ChatInput) {
    let conversation = input.conversationId
      ? await prisma.conversation.findFirst({ where: { id: input.conversationId, userId } })
      : null;

    if (input.conversationId && !conversation) throw new NotFoundError('Conversation not found');

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          propertyId: input.propertyId ?? null,
          title: input.message.slice(0, 60),
        },
      });
    }

    const propertyId = input.propertyId ?? conversation.propertyId;
    let property: PropertyDto | null = null;
    if (propertyId) {
      property = await propertiesService.getById(propertyId, viewer);
    }

    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    const historyText = history.map((item) => `${item.role}: ${item.content}`).join('\n');

    let answer: string;
    if (geminiEnabled && property) {
      try {
        const generated = await generateText(
          SYSTEM_INSTRUCTION,
          `Verified property context:\n${propertyContext(property)}\n\nConversation so far:\n${historyText}\n\nBuyer question: ${input.message}`,
        );
        if (containsUnverifiedNumber(generated, property, input.message)) {
          throw new Error('AI answer contained unverified numbers');
        }
        answer = generated;
      } catch (error) {
        logger.warn({ err: error }, 'Gemini chat failed; using grounded template');
        answer = fallbackAnswer(input.message, property);
      }
    } else {
      answer = fallbackAnswer(input.message, property);
    }

    const [, assistantMessage] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: conversation.id, role: 'USER', content: input.message },
      }),
      prisma.message.create({
        data: { conversationId: conversation.id, role: 'ASSISTANT', content: answer },
      }),
      prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } }),
    ]);

    return { conversationId: conversation.id, messageId: assistantMessage.id, answer };
  },

  async listConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  },

  async getConversation(userId: string, id: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundError('Conversation not found');
    return conversation;
  },

  async deleteConversation(userId: string, id: string): Promise<void> {
    const conversation = await prisma.conversation.findFirst({ where: { id, userId } });
    if (!conversation) throw new NotFoundError('Conversation not found');
    await prisma.conversation.delete({ where: { id } });
  },
};
