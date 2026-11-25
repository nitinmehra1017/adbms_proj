import { apiRequest } from './api';
import type { AiQueryAuditResponse } from '../types/audit';

export function getAiQueryAuditLogs() {
  return apiRequest<AiQueryAuditResponse>('/api/db/ai-audit');
}
