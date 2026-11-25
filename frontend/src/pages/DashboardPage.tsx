import { AlertTriangle, ChevronDown, ChevronUp, Code, Database, LoaderCircle, Send, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResultTable } from '../components/ResultTable';
import { ResultVisualization } from '../components/ResultVisualization';
import { RecentQueries } from '../components/RecentQueries';
import { useAuth } from '../hooks/useAuth';
import { useSessionQueryHistory } from '../hooks/useSessionQueryHistory';
import { ApiError } from '../services/api';
import { askAssistant } from '../services/assistant';
import type { AssistantResponse } from '../types/assistant';

const SUGGESTED_QUESTIONS = [
  'How many patients are in the database?',
  'Show department admission statistics',
  'List patients admitted with diabetes',
  'What is the average billing amount?',
];

export function DashboardPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const { history, selected, selectedId, add, select, clear } = useSessionQueryHistory();
  const [error, setError] = useState<{ title: string; detail: string; retryable: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) {
      setError({
        title: 'Enter a question first.',
        detail: 'Ask a question about the healthcare database to continue.',
        retryable: false,
      });
      return;
    }
    if (normalizedQuestion.length > 2_000) {
      setError({
        title: 'Question is too long.',
        detail: 'Questions must be 2000 characters or fewer.',
        retryable: false,
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await askAssistant(normalizedQuestion);
      add(response);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await refresh();
        navigate('/login', { replace: true });
        return;
      }
      setError(toAssistantError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <Sparkles size={14} className="text-blue-600" />
          AI Clinical Assistant
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            AI Healthcare Assistant
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Ask questions about your healthcare data in plain language.
          </p>
        </div>

        {/* Suggested Question Chips */}
        <div className="pt-2">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Suggested questions
          </p>
          <div className="flex flex-wrap gap-2.5">
            {SUGGESTED_QUESTIONS.map((chipText) => (
              <button
                key={chipText}
                type="button"
                onClick={() => setQuestion(chipText)}
                className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {chipText}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Question Form */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <label htmlFor="assistant-question" className="block text-sm font-semibold text-gray-900">
            Your question
          </label>
          <textarea
            id="assistant-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={loading}
            rows={4}
            maxLength={2_000}
            placeholder="e.g. How many patients were admitted in the last six months?"
            className="mt-3 block w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-400">
              {question.length}/2000 characters
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {loading ? 'Processing question…' : 'Ask AI'}
            </button>
          </div>
        </form>
      </section>

      {/* Loading State */}
      {loading && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <LoaderCircle size={22} className="animate-spin text-blue-600 shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">Processing your question</p>
              <p className="mt-0.5 text-sm text-blue-700">
                The backend is preparing and validating a database query for your request.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Error State */}
      {error && (
        <section role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-rose-600" size={20} />
            <div className="flex-1">
              <h2 className="font-semibold text-rose-900">{error.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-rose-700">{error.detail}</p>
              {error.retryable && (
                <button
                  type="button"
                  onClick={() => void handleSubmit({ preventDefault: () => undefined } as FormEvent<HTMLFormElement>)}
                  disabled={loading}
                  className="mt-3.5 inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Recent Queries + Results Workspace */}
      <section className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <RecentQueries
          history={history}
          selectedId={selectedId}
          onSelect={select}
          onClear={clear}
        />
        <div>
          {selected && <AssistantResult response={selected.response} />}
          {!selected && !error && !loading && (
            <section className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50/40 via-white to-gray-50/40 p-12 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
                <Database size={28} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Start by asking a question above
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">
                Validated database answers. Questions are sent to the authenticated backend, where generated SQL is validated before any read-only query is executed.
              </p>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

function AssistantResult({ response }: { response: AssistantResponse }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="space-y-6">
      {/* Question Echo */}
      <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Question
        </p>
        <p className="mt-2 text-lg font-semibold text-gray-900">
          {response.question}
        </p>
      </article>

      {/* AI Explanation */}
      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-gray-100 bg-blue-50/60 px-5 py-3.5 sm:px-6">
          <Sparkles size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">AI Explanation</h2>
        </div>
        <div className="p-5 sm:p-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {response.explanation || 'No explanation was returned for this query.'}
          </p>
        </div>
      </article>

      {/* Collapsible Advanced Details (Generated SQL & Tables) */}
      <article className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between p-5 text-left transition hover:bg-gray-50/80 sm:p-6"
          aria-expanded={isExpanded}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <Code size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Advanced Details</h2>
            {response.query_type && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {response.query_type}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <span>{isExpanded ? 'Hide SQL' : 'View SQL & details'}</span>
            {isExpanded ? (
              <ChevronUp size={16} className="text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-500" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-gray-100 p-5 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Generated SQL
              </p>
              <pre className="mt-2.5 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-sm leading-relaxed text-gray-800">
                <code>{response.sql}</code>
              </pre>
            </div>

            {response.tables_used.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tables Used
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {response.tables_used.map((table) => (
                    <span
                      key={table}
                      className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {table}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </article>

      {/* Visualization */}
      <ResultVisualization result={response.result} />

      {/* Database Result Table */}
      <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 pb-4">
          <h2 className="font-semibold text-gray-900">Database Result</h2>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {response.result.rowCount} {response.result.rowCount === 1 ? 'row' : 'rows'}
          </span>
        </div>
        <div className="mt-4">
          <ResultTable result={response.result} />
        </div>
      </article>
    </section>
  );
}

function toAssistantError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 503) return { title: 'AI SQL generation is temporarily unavailable.', detail: 'Gemini is currently unavailable. Please try again later.', retryable: true };
    if (error.status === 403) return { title: 'This request is not permitted.', detail: 'Your account is not authorized to use this operation.', retryable: false };
    if (error.status === 400) return { title: 'The question could not be processed.', detail: 'Please review the question and try again.', retryable: false };
    if (error.isNetworkError) return { title: 'Backend unavailable.', detail: 'The healthcare API could not be reached. Please try again later.', retryable: true };
  }
  return { title: 'Unable to process your question.', detail: 'The server encountered a problem. Please try again later.', retryable: true };
}
