export type AiQueryAuditStatus =
  | 'SUCCESS'
  | 'VALIDATION_REJECTED'
  | 'GEMINI_UNAVAILABLE'
  | 'EXECUTION_FAILED'
  | 'SYSTEM_ERROR';

export type AiQueryAuditRecord = {
  id: number;
  userId: number;
  email: string;
  question: string;
  generatedSql: string | null;
  queryType: string | null;
  executionStatus: AiQueryAuditStatus;
  rowCount: number | null;
  executionTimeMs: number | null;
  createdAt: string;
};

export type AiQueryAuditResponse = {
  auditLogs: AiQueryAuditRecord[];
};
