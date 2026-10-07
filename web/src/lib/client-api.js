// Browser fetch wrapper for the { success, data, error } envelope.
export async function api(url, { method = "GET", body } = {}) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = new Error(json?.error ?? `Request failed (${res.status})`);
    err.status = res.status;
    err.details = json?.details;
    throw err;
  }
  return json.data;
}
