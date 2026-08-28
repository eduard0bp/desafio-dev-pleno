export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => undefined);
  return body?.error?.message ?? fallback;
}

export async function requestJson<T>(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(fallbackMessage);
  }
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, fallbackMessage));
  }
  return response.json();
}
