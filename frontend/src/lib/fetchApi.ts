const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      statusCode: response.status,
      message: response.statusText,
      error: 'Request Failed',
    }));
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

fetchApi.get = <T>(url: string): Promise<T> => fetchApi<T>(url);

fetchApi.post = <T>(url: string, body?: unknown): Promise<T> =>
  fetchApi<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

fetchApi.patch = <T>(url: string, body?: unknown): Promise<T> =>
  fetchApi<T>(url, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });

fetchApi.delete = <T>(url: string): Promise<T> =>
  fetchApi<T>(url, { method: 'DELETE' });

export { fetchApi };
