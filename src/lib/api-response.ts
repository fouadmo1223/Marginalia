export function jsonOk(data: unknown, init: number = 200): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: init,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonError(message: string, status: number = 400, code?: string): Response {
  return new Response(JSON.stringify({ ok: false, error: { message, code } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function handleApiError(err: unknown): Response {
  if (err instanceof ApiError) {
    return jsonError(err.message, err.status, err.code);
  }
  // Never leak internal error details to the client.
  console.error(err);
  return jsonError('Something went wrong. Please try again.', 500);
}
