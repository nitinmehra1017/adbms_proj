export const MAX_SQL_LENGTH = 20_000;
export const MAX_RESULT_ROWS = 500;

export type SqlValidationResult =
  | { valid: true; sql: string; reason: null }
  | { valid: false; sql: string; reason: string };

type Token = {
  value: string;
  quoted: boolean;
};

const forbiddenKeywords = new Set([
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'RENAME',
  'GRANT', 'REVOKE', 'REPLACE', 'CALL', 'START', 'COMMIT', 'ROLLBACK', 'SAVEPOINT',
  'USE', 'SET', 'LOAD', 'HANDLER', 'LOCK', 'UNLOCK', 'KILL', 'PREPARE', 'EXECUTE',
  'DEALLOCATE', 'ANALYZE', 'OPTIMIZE', 'FLUSH', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN'
]);

const forbiddenSystemSchemas = new Set(['information_schema', 'mysql', 'performance_schema', 'sys']);
const aggregateFunctionNames = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']);

export function validateSql(input: unknown): SqlValidationResult {
  if (typeof input !== 'string') return invalid('', 'SQL must be a string.');

  const sql = input.trim();
  if (!sql) return invalid(sql, 'SQL must not be empty.');
  if (sql.length > MAX_SQL_LENGTH) return invalid(sql, 'SQL query exceeds the permitted length.');

  const tokenized = tokenizeSql(sql);
  if ('reason' in tokenized) return invalid(sql, tokenized.reason);
  const tokens = tokenized.tokens;
  const executableSql = tokenized.sql;
  const keywords = tokens.filter((token) => !token.quoted).map((token) => token.value.toUpperCase());

  if (!keywords.length || !['SELECT', 'WITH'].includes(keywords[0])) {
    return invalid(sql, 'Only read-only SELECT queries are allowed.');
  }
  if (keywords[0] === 'WITH' && !keywords.includes('SELECT')) {
    return invalid(sql, 'WITH queries must ultimately read with SELECT.');
  }
  if (keywords.some((keyword) => forbiddenKeywords.has(keyword))) {
    return invalid(sql, 'SQL query is not permitted.');
  }
  if (keywords.includes('INTO')) {
    return invalid(sql, 'SQL query is not permitted.');
  }
  if (referencesForbiddenSchema(tokens)) {
    return invalid(sql, 'System and external database schemas are not permitted.');
  }
  if (referencesExternalDatabase(tokens, process.env.DB_NAME)) {
    return invalid(sql, 'External database references are not permitted.');
  }

  const limit = parseLimit(tokens);
  if ('reason' in limit) return invalid(sql, limit.reason);
  if (limit.value !== null && limit.value > MAX_RESULT_ROWS) {
    return invalid(sql, `SQL result limits may not exceed ${MAX_RESULT_ROWS} rows.`);
  }
  if (limit.value === null && !isAggregateOrGroupedQuery(tokens)) {
    return invalid(sql, `Non-aggregate queries must include LIMIT ${MAX_RESULT_ROWS} or lower.`);
  }

  return { valid: true, sql: executableSql, reason: null };
}

function tokenizeSql(sql: string): { tokens: Token[]; sql: string } | { reason: string } {
  const tokens: Token[] = [];
  let index = 0;
  let trailingSemicolon = false;

  while (index < sql.length) {
    const character = sql[index];
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    if (character === '-' && sql[index + 1] === '-' || character === '#' || character === '/' && sql[index + 1] === '*') {
      return { reason: 'SQL comments are not permitted.' };
    }
    if (character === ';') {
      trailingSemicolon = true;
      index += 1;
      while (index < sql.length && /\s/.test(sql[index])) index += 1;
      return index === sql.length
        ? { tokens, sql: sql.slice(0, sql.lastIndexOf(';')).trim() }
        : { reason: 'Multiple SQL statements are not permitted.' };
    }
    if (character === "'" || character === '"') {
      const end = consumeQuotedLiteral(sql, index, character);
      if (end === -1) return { reason: 'SQL contains an unterminated quoted literal.' };
      index = end;
      continue;
    }
    if (character === '`') {
      const identifier = consumeQuotedIdentifier(sql, index);
      if (!identifier) return { reason: 'SQL contains an unterminated quoted identifier.' };
      tokens.push({ value: identifier.value, quoted: true });
      index = identifier.end;
      continue;
    }
    if (/[A-Za-z0-9_$]/.test(character)) {
      const start = index;
      while (index < sql.length && /[A-Za-z0-9_$]/.test(sql[index])) index += 1;
      tokens.push({ value: sql.slice(start, index), quoted: false });
      continue;
    }
    if (character === '.' || character === ',' || character === '(' || character === ')') {
      tokens.push({ value: character, quoted: false });
    }
    index += 1;
  }

  return trailingSemicolon ? { reason: 'Multiple SQL statements are not permitted.' } : { tokens, sql };
}

function consumeQuotedLiteral(sql: string, start: number, quote: string) {
  for (let index = start + 1; index < sql.length; index += 1) {
    if (sql[index] === '\\') {
      index += 1;
      continue;
    }
    if (sql[index] === quote) {
      if (sql[index + 1] === quote) {
        index += 1;
        continue;
      }
      return index + 1;
    }
  }
  return -1;
}

function consumeQuotedIdentifier(sql: string, start: number) {
  let value = '';
  for (let index = start + 1; index < sql.length; index += 1) {
    if (sql[index] === '`') {
      if (sql[index + 1] === '`') {
        value += '`';
        index += 1;
        continue;
      }
      return { value, end: index + 1 };
    }
    value += sql[index];
  }
  return null;
}

function referencesForbiddenSchema(tokens: Token[]) {
  return tokens.some((token, index) =>
    token.value !== '.' &&
    forbiddenSystemSchemas.has(token.value.toLowerCase()) &&
    tokens[index + 1]?.value === '.'
  );
}

function referencesExternalDatabase(tokens: Token[], database: string | undefined) {
  for (let index = 0; index < tokens.length - 3; index += 1) {
    const keyword = tokens[index].value.toUpperCase();
    if (!['FROM', 'JOIN'].includes(keyword)) continue;
    const [schema, dot, table] = tokens.slice(index + 1, index + 4);
    if (schema && dot?.value === '.' && table && database && schema.value.toLowerCase() !== database.toLowerCase()) {
      return true;
    }
  }
  return false;
}

function parseLimit(tokens: Token[]): { value: number | null } | { reason: string } {
  const index = tokens.findIndex((token) => !token.quoted && token.value.toUpperCase() === 'LIMIT');
  if (index === -1) return { value: null };

  const first = tokens[index + 1];
  if (!first || first.quoted || !/^\d+$/.test(first.value)) {
    return { reason: 'LIMIT must use a non-negative numeric value.' };
  }
  const separator = tokens[index + 2];
  const valueToken = separator?.value === ',' || separator?.value.toUpperCase() === 'OFFSET' ? tokens[index + 3] : first;
  if (!valueToken || valueToken.quoted || !/^\d+$/.test(valueToken.value)) {
    return { reason: 'LIMIT must use a non-negative numeric value.' };
  }
  return { value: Number(valueToken.value) };
}

function isAggregateOrGroupedQuery(tokens: Token[]) {
  return tokens.some((token, index) => {
    if (token.quoted) return false;
    const keyword = token.value.toUpperCase();
    return (
      aggregateFunctionNames.has(keyword) && tokens[index + 1]?.value === '(' ||
      keyword === 'GROUP' && tokens[index + 1]?.value.toUpperCase() === 'BY'
    );
  });
}

function invalid(sql: string, reason: string): SqlValidationResult {
  return { valid: false, sql, reason };
}
