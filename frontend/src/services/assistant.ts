import type { AssistantResponse } from '../types/assistant';
import { apiRequest } from './api';

export function askAssistant(question: string) {
  return apiRequest<AssistantResponse>('/api/ai/assistant', {
    method: 'POST',
    body: JSON.stringify({ question })
  });
}
