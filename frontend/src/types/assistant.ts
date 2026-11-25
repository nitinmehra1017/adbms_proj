export type AssistantQueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
};

export type AssistantResponse = {
  success: true;
  question: string;
  sql: string;
  explanation: string;
  tables_used: string[];
  query_type?: string;
  result: AssistantQueryResult;
};
