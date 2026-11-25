import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool.js';

export type AiQueryExecutionStatus = 'SUCCESS' | 'VALIDATION_REJECTED' | 'GEMINI_UNAVAILABLE' | 'EXECUTION_FAILED' | 'SYSTEM_ERROR';

export type AiQueryAuditEntry = {
  userId: number;
  question: string;
  generatedSql?: string | null;
  queryType?: string | null;
  executionStatus: AiQueryExecutionStatus;
  rowCount?: number | null;
  executionTimeMs?: number | null;
};

type AuditRow = RowDataPacket & {
  id: number;
  userId: number;
  email: string;
  question: string;
  generatedSql: string | null;
  queryType: string | null;
  executionStatus: AiQueryExecutionStatus;
  rowCount: number | null;
  executionTimeMs: number | null;
  createdAt: Date;
};

export async function recordAiQueryAudit(entry: AiQueryAuditEntry) {
  await pool.execute(
    `INSERT INTO ai_query_audit_logs
      (user_id, question, generated_sql, query_type, execution_status, row_count, execution_time_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.userId,
      redactAuditSecrets(entry.question),
      entry.generatedSql ? redactAuditSecrets(entry.generatedSql) : null,
      entry.queryType ?? null,
      entry.executionStatus,
      entry.rowCount ?? null,
      entry.executionTimeMs ?? null
    ]
  );
}

export async function getRecentAiQueryAudits(limit = 100) {
  const [rows] = await pool.execute<AuditRow[]>(
    `SELECT a.id, a.user_id AS userId, u.email, a.question, a.generated_sql AS generatedSql,
            a.query_type AS queryType, a.execution_status AS executionStatus,
            a.row_count AS rowCount, a.execution_time_ms AS executionTimeMs, a.created_at AS createdAt
     FROM ai_query_audit_logs AS a
     INNER JOIN users AS u ON u.user_id = a.user_id
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT ?`,
    [Math.min(Math.max(limit, 1), 100)]
  );
  return rows;
}

function redactAuditSecrets(value: string) {
  return value
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_JWT]')
    .replace(/(\b(?:password|api[_-]?key|token)\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/(Bearer\s+)[^\s]+/gi, '$1[REDACTED]');
}
