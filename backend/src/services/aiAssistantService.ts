import {
  generateSqlFromQuestion,
  type GeneratedSql
} from './geminiService.js';
import { getHealthcareSchemaContext } from './schemaService.js';
import {
  executeReadOnlySql,
  type SqlExecutionResult
} from './sqlExecutionService.js';
import { validateSql, type SqlValidationResult } from './sqlValidator.js';

export class AssistantValidationError extends Error {
  constructor(message: string, public readonly generated?: GeneratedSql) {
    super(message);
    this.name = 'AssistantValidationError';
  }
}

export class AssistantExecutionError extends Error {
  constructor(message: string, public readonly generated: GeneratedSql) {
    super(message);
    this.name = 'AssistantExecutionError';
  }
}

export type AssistantResponse = GeneratedSql & {
  result: SqlExecutionResult;
};

export type AssistantExecutionDetails = {
  response: AssistantResponse;
  executionTimeMs: number;
};

type AssistantDependencies = {
  getSchemaContext: () => Promise<string>;
  generateSql: (question: string, schemaContext: string) => Promise<GeneratedSql>;
  validate: (sql: unknown) => SqlValidationResult;
  executeSql: (sql: string) => Promise<SqlExecutionResult>;
};

const defaultDependencies: AssistantDependencies = {
  getSchemaContext: getHealthcareSchemaContext,
  generateSql: generateSqlFromQuestion,
  validate: validateSql,
  executeSql: executeReadOnlySql
};

export async function answerHealthcareQuestion(
  question: string,
  dependencies: AssistantDependencies = defaultDependencies
): Promise<AssistantResponse> {
  return (await answerHealthcareQuestionWithExecutionDetails(question, dependencies)).response;
}

export async function answerHealthcareQuestionWithExecutionDetails(
  question: string,
  dependencies: AssistantDependencies = defaultDependencies
): Promise<AssistantExecutionDetails> {
  const schemaContext = await dependencies.getSchemaContext();
  const generated = await dependencies.generateSql(question, schemaContext);
  const validation = dependencies.validate(generated.sql);
  if (!validation.valid) {
    throw new AssistantValidationError('Generated SQL was rejected by the safety validator.', generated);
  }

  const executionStartedAt = performance.now();
  try {
    const result = await dependencies.executeSql(validation.sql);
    return {
      response: { ...generated, sql: validation.sql, result },
      executionTimeMs: Math.round(performance.now() - executionStartedAt)
    };
  } catch (error) {
    throw new AssistantExecutionError(error instanceof Error ? error.message : 'Read-only SQL execution failed.', generated);
  }
}
