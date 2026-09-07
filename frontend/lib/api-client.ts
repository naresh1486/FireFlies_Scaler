export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
}

const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const baseUrl = rawBaseUrl
  ? rawBaseUrl.replace(/\/$/, "")
  : process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:8000";

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullPath = baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;

  if (!params) {
    return fullPath;
  }

  const [base, existingQuery] = fullPath.split("?");
  const searchParams = new URLSearchParams(existingQuery);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    searchParams.append(key, String(value));
  });

  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: { error?: { code: string; message: string; details?: Record<string, unknown> } } | null = null;
  try {
    payload = await response.json();
  } catch {
    // ignore
  }
  const err = payload?.error;
  if (err) {
    return new ApiError(response.status, err.code, err.message, err.details);
  }
  return new ApiError(response.status, "unknown_error", `Request failed: ${response.status}`);
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  const response = await fetch(buildUrl(path, options.params), {
    method,
    headers,
    body,
    signal: options.signal,
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, options?: RequestOptions) => request<T>("POST", path, options),
  patch: <T>(path: string, options?: RequestOptions) => request<T>("PATCH", path, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};

export const API_BASE_URL = baseUrl;