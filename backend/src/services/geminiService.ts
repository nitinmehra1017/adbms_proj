import { GoogleGenAI } from '@google/genai';

export class GeminiConfigurationError extends Error {}
export class GeminiServiceError extends Error {
  constructor(message: string, public readonly diagnostic?: Record<string, unknown>) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

export type GeneratedSql = {
  sql: string;
  explanation: string;
  tables_used: string[];
  query_type?: string;
};

function client() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiConfigurationError('Gemini API is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2_000;
const RETRYABLE_STATUS_CODES = new Set([429, 503]);

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const status = typeof error === 'object' && error !== null && 'status' in error
        ? (error as { status: unknown }).status
        : undefined;
      const isRetryable = typeof status === 'number' && RETRYABLE_STATUS_CODES.has(status);

      if (!isRetryable || attempt === MAX_RETRIES) throw error;

      const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 1_000);
      console.log(`[Gemini retry] ${label} attempt ${attempt}/${MAX_RETRIES} returned ${status}, retrying in ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Unreachable');
}

export async function generateTestResponse(prompt: string): Promise<string> {
  const model = process.env.GEMINI_MODEL?.trim();
  if (!model) {
    throw new GeminiConfigurationError('Gemini model is not configured.');
  }
  try {
    const response = await withRetry('test', () => client().models.generateContent({
      model,
      contents: prompt
    }));
    const text = response.text?.trim();
    if (!text) {
      throw new GeminiServiceError('Gemini returned no text response.');
    }
    return text;
  } catch (error) {
    if (error instanceof GeminiConfigurationError || error instanceof GeminiServiceError) throw error;
    throw new GeminiServiceError('Gemini service request failed.', {
      model,
      runtime: process.version,
      name: error instanceof Error ? error.name : 'UnknownError',
      status: typeof error === 'object' && error !== null && 'status' in error ? (error as { status: unknown }).status : undefined,
      code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code: unknown }).code : undefined,
      message: error instanceof Error ? redactSecrets(error.message) : 'Non-Error exception returned by Gemini SDK'
    });
  }
}

export async function generateSqlFromQuestion(question: string, schemaContext: string): Promise<GeneratedSql> {
  const model = process.env.GEMINI_MODEL?.trim();
  if (!model) throw new GeminiConfigurationError('Gemini model is not configured.');

  const systemInstruction = `You are a SQL generation assistant for a healthcare relational database.
Generate MySQL-compatible, read-only analytical SQL only. Use only tables, views, columns, and foreign-key relationships listed in the supplied schema. Prefer explicit JOIN conditions. Never invent tables, columns, or relationships. Never generate data modification or database-definition statements. If the question cannot be answered with the supplied schema, return an empty sql string and explain why. Return JSON matching the requested schema.`;
  try {
    const response = await withRetry('sql', () => client().models.generateContent({
      model,
      contents: `ACTUAL DATABASE SCHEMA:\n${schemaContext}\n\nUSER QUESTION:\n${question}\n\nReturn ONLY a valid JSON object with exactly this shape:\n{\n  "sql": "string",\n  "explanation": "string",\n  "tables_used": ["string"],\n  "query_type": "string"\n}\nDo not use Markdown fences or include additional text. Generate MySQL-compatible read-only SQL only. Use only the supplied schema tables, columns, and relationships; never invent schema. If the question cannot be answered, return an empty string for "sql" and explain why.`,
      config: {
        systemInstruction
      }
    }));
    return parseGeneratedSql(response.text);
  } catch (error) {
    if (error instanceof GeminiConfigurationError || error instanceof GeminiServiceError) throw error;
    throw new GeminiServiceError('Gemini SQL generation request failed.', {
      model,
      runtime: process.version,
      name: error instanceof Error ? error.name : 'UnknownError',
      status: typeof error === 'object' && error !== null && 'status' in error ? (error as { status: unknown }).status : undefined,
      code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code: unknown }).code : undefined,
      message: error instanceof Error ? redactSecrets(error.message) : 'Non-Error exception returned by Gemini SDK'
    });
  }
}

function parseGeneratedSql(text: string | undefined): GeneratedSql {
  if (!text) throw new GeminiServiceError('Gemini returned no structured response.');
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null) throw new Error();
    const result = parsed as Partial<GeneratedSql>;
    if (typeof result.sql !== 'string' || typeof result.explanation !== 'string' || !Array.isArray(result.tables_used) || !result.tables_used.every((table) => typeof table === 'string')) {
      throw new Error();
    }
    return { sql: result.sql, explanation: result.explanation, tables_used: result.tables_used, ...(typeof result.query_type === 'string' ? { query_type: result.query_type } : {}) };
  } catch {
    throw new GeminiServiceError('Gemini returned malformed structured SQL output.');
  }
}

function redactSecrets(value: string) {
  return value
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/([?&](?:key|api[_-]?key)=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/(Bearer\s+)[^\s]+/gi, '$1[REDACTED]');
}
