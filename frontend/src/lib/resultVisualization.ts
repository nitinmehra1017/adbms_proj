import type { AssistantQueryResult } from '../types/assistant';

export type VisualizationModel =
  | { kind: 'kpi'; valueColumn: string; value: number }
  | { kind: 'bar' | 'line'; categoryColumn: string; valueColumn: string; data: Array<Record<string, string | number>> }
  | { kind: 'none' };

export function getResultVisualization(result: AssistantQueryResult): VisualizationModel {
  if (!result.rows.length || !result.columns.length) return { kind: 'none' };

  if (result.rows.length === 1 && result.columns.length === 1) {
    const value = toNumber(result.rows[0][result.columns[0]]);
    if (value !== null) return { kind: 'kpi', valueColumn: result.columns[0], value };
  }

  if (result.rows.length < 2) return { kind: 'none' };
  const numericColumns = result.columns.filter((column) => hasOnlyNumericValues(result.rows, column));
  const categoryColumns = result.columns.filter((column) => hasOnlyCategoryValues(result.rows, column));
  if (numericColumns.length !== 1 || categoryColumns.length !== 1) return { kind: 'none' };

  const valueColumn = numericColumns[0];
  const categoryColumn = categoryColumns[0];
  const data = result.rows.flatMap((row) => {
    const value = toNumber(row[valueColumn]);
    const category = toCategory(row[categoryColumn]);
    return value === null || category === null ? [] : [{ [categoryColumn]: category, [valueColumn]: value }];
  });
  if (data.length < 2) return { kind: 'none' };
  return {
    kind: data.every((row) => looksLikeTimeValue(row[categoryColumn])) ? 'line' : 'bar',
    categoryColumn,
    valueColumn,
    data
  };
}

function hasOnlyNumericValues(rows: Record<string, unknown>[], column: string) {
  const values = rows.map((row) => row[column]).filter((value) => value !== null && value !== undefined);
  return values.length > 0 && values.length === rows.length && values.every((value) => toNumber(value) !== null);
}

function hasOnlyCategoryValues(rows: Record<string, unknown>[], column: string) {
  const values = rows.map((row) => toCategory(row[column]));
  return values.every((value) => value !== null) && new Set(values).size === values.length;
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(value.trim())) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }
  return null;
}

function toCategory(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return null;
}

function looksLikeTimeValue(value: string | number) {
  if (typeof value !== 'string') return false;
  return /^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?$/.test(value);
}
