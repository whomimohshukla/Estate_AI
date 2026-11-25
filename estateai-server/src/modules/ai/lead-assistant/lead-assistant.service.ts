import type { Lead, Property, User } from '@prisma/client';
import { prisma } from '../../../config/database.js';
import { generateText, geminiEnabled } from '../../../config/gemini.js';
import { logger } from '../../../config/logger.js';
import { NotFoundError } from '../../../utils/AppError.js';
import { AMENITIES } from '../../properties/properties.schema.js';
import { propertyQuerySchema } from '../../properties/properties.schema.js';
import { propertiesService } from '../../properties/properties.service.js';
import type { LeadAssistantInput, LeadAssistantTask } from './lead-assistant.schema.js';

type LeadContext = Lead & { property: Property; buyer: User };

const SYSTEM_INSTRUCTION = [
  'You are an assistant for a real estate agent.',
  'Use only the supplied lead and verified listing facts.',
  'Never invent budget, availability, contact details, amenities or dates.',
  'Write concise, professional, actionable output.',
].join(' ');

function leadFacts(lead: LeadContext): string {
  const ageDays = Math.floor((Date.now() - lead.createdAt.getTime()) / 86_400_000);
  return [
    `Lead status: ${lead.status}`,
    `Lead age days: ${ageDays}`,
    `Buyer: ${lead.buyer.firstName} ${lead.buyer.lastName}`,
    `Listing: ${lead.property.title}`,
    `Listing price INR: ${String(lead.property.price)}`,
    `Listing type: ${lead.property.propertyType}`,
    `Listing purpose: ${lead.property.purpose}`,
    `Listing bedrooms: ${lead.property.bedrooms}`,
    `Listing area sq ft: ${lead.property.areaSqFt}`,
    `Listing city: ${lead.property.city}`,
    `Listing locality: ${lead.property.locality}`,
    `Listing amenities: ${lead.property.amenities.join(', ') || 'none supplied'}`,
    `Lead budget max INR: ${lead.budgetMax ? String(lead.budgetMax) : 'not supplied'}`,
    `Lead requirements: ${lead.requirements ?? 'not supplied'}`,
    `Lead message: ${lead.message}`,
    `Lead source: ${lead.source ?? 'not supplied'}`,
  ].join('\n');
}

function taskPrompt(task: LeadAssistantTask): string {
  switch (task) {
    case 'SUMMARIZE':
      return 'Summarize this lead for the agent in three short sentences. Include status, interest and budget only if supplied.';
    case 'FOLLOW_UP':
      return 'Write a short follow-up message the agent can send to this buyer. Ask only about details not already supplied.';
    case 'QUESTIONS':
      return 'List four discovery questions for the agent to ask this buyer, one per line.';
    case 'PROPERTY_MATCH':
      return 'Explain in two sentences why the supplied matching listings fit this lead. Use only facts in the context.';
  }
}

function fallbackForTask(task: Exclude<LeadAssistantTask, 'PROPERTY_MATCH'>, lead: LeadContext): string {
  const name = `${lead.buyer.firstName} ${lead.buyer.lastName}`.trim();
  const budget = lead.budgetMax ? ` Their stated budget is INR ${String(lead.budgetMax)}.` : '';
  const requirements = lead.requirements ? ` Requirements: ${lead.requirements}.` : '';

  switch (task) {
    case 'SUMMARIZE':
      return `${name} contacted you about ${lead.property.title} in ${lead.property.locality}, ${lead.property.city}, which is listed at INR ${String(lead.property.price)}. Lead status is ${lead.status.toLowerCase()}.${budget}${requirements}`;
    case 'FOLLOW_UP':
      return `Hi ${lead.buyer.firstName}, thanks for your interest in ${lead.property.title}. It is listed at INR ${String(lead.property.price)} in ${lead.property.locality}, ${lead.property.city}. Could you confirm your preferred timeline and which features matter most to you?`;
    case 'QUESTIONS':
      return [
        'What is your ideal move-in or purchase timeline?',
        'Is your budget flexible, and by how much?',
        'Which features are must-haves for this property?',
        'Have you already seen similar listings, and what did you like or dislike?',
      ].join('\n');
  }
}

function containsUnverifiedNumber(answer: string, facts: string): boolean {
  const allowed = new Set(facts.match(/\b\d+(?:\.\d+)?\b/g) ?? []);
  return (answer.match(/\b\d+(?:\.\d+)?\b/g) ?? []).some((number) => !allowed.has(number));
}

async function findMatches(lead: LeadContext) {
  const text = `${lead.requirements ?? ''} ${lead.message}`.toLowerCase();
  const bedrooms = text.match(/\b(\d+)\s*(?:bhk|bedroom)/)?.[1];
  const amenities = AMENITIES.filter(
    (amenity) =>
      text.includes(amenity.toLowerCase()) || text.includes(amenity.toLowerCase().replaceAll('_', ' ')),
  );
  const budget = lead.budgetMax ? Number(lead.budgetMax.toString()) : undefined;

  const query = propertyQuerySchema.parse({
    page: 1,
    limit: 3,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    city: lead.property.city,
    purpose: lead.property.purpose,
    maxPrice: budget,
    bedrooms: bedrooms ? Number(bedrooms) : undefined,
    amenities: amenities.length ? amenities : undefined,
  });

  return propertiesService.list(query);
}

export const leadAssistantService = {
  async assist(agentId: string, input: LeadAssistantInput) {
    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, agentId },
      include: { property: true, buyer: true },
    });
    if (!lead) throw new NotFoundError('Lead not found');

    const facts = leadFacts(lead);
    const matches = input.task === 'PROPERTY_MATCH' ? await findMatches(lead) : null;
    let answer = input.task === 'PROPERTY_MATCH' ? '' : fallbackForTask(input.task, lead);

    if (geminiEnabled) {
      const matchFacts = matches
        ? matches.items
            .map((property) => `${property.title}; INR ${property.price}; ${property.city}; ${property.amenities.join(', ')}`)
            .join('\n')
        : '';
      try {
        const generated = await generateText(
          SYSTEM_INSTRUCTION,
          `${facts}\n${matchFacts ? `Matching listings:\n${matchFacts}\n` : ''}${taskPrompt(input.task)}`,
          0.3,
        );
        if (containsUnverifiedNumber(generated, `${facts}\n${matchFacts}`)) {
          throw new Error('AI lead answer contained unverified numbers');
        }
        answer = generated;
      } catch (error) {
        logger.warn({ err: error }, 'Gemini lead assistant failed; using grounded template');
        if (!answer) {
          answer = matches?.items.length
            ? `Matching listings: ${matches.items.map((property) => property.title).join(', ')}.`
            : 'No current verified listings match these lead requirements.';
        }
      }
    }

    return {
      leadId: lead.id,
      task: input.task,
      answer,
      suggestions: answer.split('\n').map((line) => line.trim()).filter(Boolean),
      matches: matches?.items ?? [],
    };
  },
};
