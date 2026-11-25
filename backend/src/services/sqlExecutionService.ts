import type { FieldPacket, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool.js';
import { MAX_RESULT_ROWS, validateSql } from './sqlValidator.js';

export class SqlExecutionError extends Error {}

export type SqlExecutionResult = {
  columns: string[];
  rows: RowDataPacket[];
  rowCount: number;
};

const QUERY_TIMEOUT_MS = 5_000;

export async function executeReadOnlySql(sql: string): Promise<SqlExecutionResult> {
  const validation = validateSql(sql);
  if (!validation.valid) throw new SqlExecutionError(validation.reason);

  try {
    const [rows, fields] = await pool.query<RowDataPacket[]>({
      sql: validation.sql,
      timeout: QUERY_TIMEOUT_MS
    });

    if (!Array.isArray(rows) || !Array.isArray(fields)) {
      throw new SqlExecutionError('The query did not return a readable result set.');
    }
    if (rows.length > MAX_RESULT_ROWS) {
      throw new SqlExecutionError(`The query returned more than ${MAX_RESULT_ROWS} rows.`);
    }
    return {
      columns: (fields as FieldPacket[]).map((field) => field.name),
      rows,
      rowCount: rows.length
    };
  } catch (error) {
    if (error instanceof SqlExecutionError) throw error;
    throw new SqlExecutionError('Read-only SQL execution failed.');
  }
}
