export type HealthResponse = { status: string; message: string; detail?: string };

async function getHealth(path: string): Promise<HealthResponse> {
  const response = await fetch(path);
  const body = (await response.json()) as HealthResponse;
  if (!response.ok) throw new Error(body.detail ?? body.message);
  return body;
}

export const getBackendHealth = () => getHealth('/api/health');
export const getDatabaseHealth = () => getHealth('/api/db/health');
