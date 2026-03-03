import { queekClient } from './queek-client';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const withQuery = (
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): string => {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
};

export const apiGet = <T>(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): Promise<T> => queekClient.get<unknown>(withQuery(path, query)) as Promise<unknown> as Promise<T>;

export const apiPost = <T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<T> => queekClient.post<unknown>(path, body ?? {}) as Promise<unknown> as Promise<T>;
