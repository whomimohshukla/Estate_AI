import { z } from 'zod';

export const LEAD_ASSISTANT_TASKS = ['SUMMARIZE', 'FOLLOW_UP', 'QUESTIONS', 'PROPERTY_MATCH'] as const;

export const leadAssistantSchema = z.object({
  leadId: z.string().uuid(),
  task: z.enum(LEAD_ASSISTANT_TASKS),
});

export type LeadAssistantInput = z.infer<typeof leadAssistantSchema>;
export type LeadAssistantTask = LeadAssistantInput['task'];
