export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new ApiError('Unable to reach the backend. Check that the API is running.', undefined, true);
  }

  const body = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) {
    if (response.status >= 500) {
      throw new ApiError('The backend is currently unavailable. Check the API and try again.', response.status, true);
    }
    throw new ApiError(body.message ?? 'The request could not be completed.', response.status);
  }
  return body as T;
}
