import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool.js';

type ColumnMetadata = RowDataPacket & {
  tableName: string;
  tableType: 'BASE TABLE' | 'VIEW';
  columnName: string;
  columnType: string;
  isNullable: 'YES' | 'NO';
  columnKey: string;
  ordinalPosition: number;
};

type ForeignKeyMetadata = RowDataPacket & {
  tableName: string;
  columnName: string;
  constraintName: string;
  referencedTableName: string;
  referencedColumnName: string;
};

export async function getHealthcareSchemaContext() {
  const database = process.env.DB_NAME;
  if (!database) throw new Error('Database schema is not configured.');

  // Explicit aliases make mysql2 result keys stable and match the TypeScript types below.
  const [columns] = await pool.query<ColumnMetadata[]>(
    `SELECT
       t.table_name AS tableName,
       t.table_type AS tableType,
       c.column_name AS columnName,
       c.column_type AS columnType,
       c.is_nullable AS isNullable,
       c.column_key AS columnKey,
       c.ordinal_position AS ordinalPosition
     FROM information_schema.tables AS t
     INNER JOIN information_schema.columns AS c
       ON c.table_schema = t.table_schema AND c.table_name = t.table_name
     WHERE t.table_schema = ?
       AND t.table_type IN ('BASE TABLE', 'VIEW')
     ORDER BY t.table_name ASC, c.ordinal_position ASC`,
    [database]
  );
  const [foreignKeys] = await pool.query<ForeignKeyMetadata[]>(
    `SELECT
       table_name AS tableName,
       column_name AS columnName,
       constraint_name AS constraintName,
       referenced_table_name AS referencedTableName,
       referenced_column_name AS referencedColumnName
     FROM information_schema.key_column_usage
     WHERE table_schema = ? AND referenced_table_name IS NOT NULL
     ORDER BY table_name ASC, column_name ASC, constraint_name ASC`,
    [database]
  );

  assertMetadata(columns, foreignKeys);

  const lines: string[] = [];
  let currentTable = '';
  const seenColumns = new Set<string>();

  for (const column of columns) {
    const columnIdentity = `${column.tableName}.${column.columnName}`;
    if (seenColumns.has(columnIdentity)) continue;
    seenColumns.add(columnIdentity);

    if (column.tableName !== currentTable) {
      currentTable = column.tableName;
      lines.push(`${column.tableType === 'VIEW' ? 'VIEW' : 'TABLE'} ${column.tableName}`);
    }
    const tags = [
      column.columnKey === 'PRI' ? 'PRIMARY KEY' : '',
      column.isNullable === 'NO' ? 'NOT NULL' : ''
    ].filter(Boolean);
    lines.push(`- ${column.columnName} ${column.columnType}${tags.length ? ` (${tags.join(', ')})` : ''}`);
  }

  lines.push('RELATIONSHIPS');
  const seenRelationships = new Set<string>();
  for (const key of foreignKeys) {
    const relationship = `${key.tableName}.${key.columnName} -> ${key.referencedTableName}.${key.referencedColumnName}`;
    if (seenRelationships.has(relationship)) continue;
    seenRelationships.add(relationship);
    lines.push(`- ${relationship}`);
  }

  return lines.join('\n');
}

function assertMetadata(columns: ColumnMetadata[], foreignKeys: ForeignKeyMetadata[]) {
  for (const column of columns) {
    if (!column.tableName || !column.tableType || !column.columnName || !column.columnType || !column.isNullable) {
      throw new Error('MySQL returned incomplete schema column metadata.');
    }
  }
  for (const key of foreignKeys) {
    if (!key.tableName || !key.columnName || !key.constraintName || !key.referencedTableName || !key.referencedColumnName) {
      throw new Error('MySQL returned incomplete foreign-key metadata.');
    }
  }
}
