import { GoogleGenAI, type Schema } from '@google/genai';
import { env } from './env.js';
import { logger } from './logger.js';
import { AppError } from '../utils/AppError.js';

export const geminiEnabled = Boolean(env.GEMINI_API_KEY);

export const geminiClient = geminiEnabled
  ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
  : null;

function cleanJson(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

export async function generateStructured<T>(options: {
  systemInstruction: string;
  prompt: string;
  schema: Schema;
}): Promise<T> {
  if (!geminiClient) throw new AppError(503, 'Gemini is not configured', 'AI_UNAVAILABLE');

  const response = await geminiClient.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: options.prompt,
    config: {
      systemInstruction: options.systemInstruction,
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: options.schema,
    },
  });

  const text = response.text;
  if (!text) throw new AppError(502, 'Gemini returned an empty response', 'AI_EMPTY_RESPONSE');

  try {
    return JSON.parse(cleanJson(text)) as T;
  } catch {
    throw new AppError(502, 'Gemini returned invalid JSON', 'AI_INVALID_RESPONSE');
  }
}

export async function generateText(systemInstruction: string, prompt: string, temperature = 0.3): Promise<string> {
  if (!geminiClient) throw new AppError(503, 'Gemini is not configured', 'AI_UNAVAILABLE');

  const response = await geminiClient.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: prompt,
    config: { systemInstruction, temperature },
  });

  const text = response.text;
  if (!text) throw new AppError(502, 'Gemini returned an empty response', 'AI_EMPTY_RESPONSE');
  return text.trim();
}

export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  if (!geminiClient || texts.length === 0) return null;

  try {
    const response = await geminiClient.models.embedContent({
      model: env.GEMINI_EMBEDDING_MODEL,
      contents: texts,
    });

    const embeddings = response.embeddings?.map((embedding) => embedding.values ?? []);
    if (!embeddings?.length || embeddings.some((values) => values.length === 0)) return null;

    return embeddings;
  } catch (error) {
    logger.warn({ err: error }, 'Gemini embedding failed');
    return null;
  }
}
