/**
 * Shared client security utilities, URL sanitization, CSRF coordination, and rate-limit helpers.
 */

export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function stripHtml(input: string): string {
  if (!input) return '';
  return input.replace(/<\/?[^>]+(>|$)/g, '');
}

export interface SafeUrlOptions {
  allowRelative?: boolean;
  fallback?: string;
}

export function isSafeUrl(rawUrl?: string | null, options: SafeUrlOptions = {}): boolean {
  if (!rawUrl || !rawUrl.trim()) return false;
  const trimmed = rawUrl.trim();

  // Reject ASCII control characters that some parsers strip before scheme parsing
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) {
      return false;
    }
  }

  // Disallow protocol-relative URLs (//evil.com)
  if (trimmed.startsWith('//')) {
    return false;
  }

  const allowRelative = options.allowRelative !== false;
  if (allowRelative && (trimmed.startsWith('/') || trimmed.startsWith('#'))) {
    return true;
  }

  try {
    const base = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://thunderfoods.vercel.app';
    const parsed = new URL(trimmed, allowRelative ? base : undefined);
    const protocol = parsed.protocol.toLowerCase();
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

export function sanitizeUrl(rawUrl?: string | null, options: SafeUrlOptions = {}): string {
  const fallback = options.fallback ?? '#';
  if (!rawUrl) return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed || !isSafeUrl(trimmed, options)) {
    return fallback;
  }
  return trimmed;
}

export function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined' || !document.cookie) {
    return null;
  }
  const cookies = document.cookie.split(';');
  for (const part of cookies) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key === name) {
      const rawVal = part.slice(eqIdx + 1).trim();
      if (!rawVal) return null;
      try {
        return decodeURIComponent(rawVal);
      } catch {
        return rawVal;
      }
    }
  }
  return null;
}

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

export function isMutatingHttpMethod(method?: string): boolean {
  return Boolean(method && MUTATING_METHODS.has(method.toLowerCase()));
}

export interface CsrfCoordinator {
  getToken: () => string | null;
  setToken: (token?: string | null) => void;
  captureFromHeaders: (headers?: Record<string, unknown> | null) => void;
  ensureToken: (forceRefresh?: boolean) => Promise<string | null>;
}

export function createCsrfCoordinator(options: {
  cookieName?: string;
  fetchToken: () => Promise<string | null>;
}): CsrfCoordinator {
  const cookieName = options.cookieName || 'XSRF-TOKEN';
  let memoryToken: string | null = null;
  let pendingFetch: Promise<string | null> | null = null;

  const getToken = (): string | null => {
    const cookieToken = getCookieValue(cookieName);
    if (cookieToken) {
      memoryToken = cookieToken;
      return cookieToken;
    }
    return memoryToken;
  };

  const setToken = (token?: string | null): void => {
    const cleaned = typeof token === 'string' ? token.trim() : '';
    memoryToken = cleaned || null;
  };

  const captureFromHeaders = (headers?: Record<string, unknown> | null): void => {
    if (!headers || typeof headers !== 'object') return;
    const rawHeader =
      headers['x-csrf-token'] ??
      headers['X-CSRF-TOKEN'] ??
      headers['X-Csrf-Token'];
    if (typeof rawHeader === 'string' && rawHeader.trim()) {
      memoryToken = rawHeader.trim();
    }
  };

  const ensureToken = async (forceRefresh = false): Promise<string | null> => {
    if (!forceRefresh) {
      const existing = getToken();
      if (existing) {
        return existing;
      }
    }

    if (!pendingFetch) {
      pendingFetch = options
        .fetchToken()
        .then((fetched) => {
          setToken(fetched);
          return getToken();
        })
        .catch(() => null)
        .finally(() => {
          pendingFetch = null;
        });
    }

    return pendingFetch;
  };

  return {
    getToken,
    setToken,
    captureFromHeaders,
    ensureToken,
  };
}

export function extractRateLimitMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const errObj = error as {
    response?: {
      status?: number;
      headers?: Record<string, unknown>;
      data?: { message?: string };
    };
  };

  if (errObj.response?.status !== 429) {
    return null;
  }

  const backendMessage = errObj.response.data?.message;
  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage;
  }

  const retryAfter =
    errObj.response.headers?.['retry-after'] ??
    errObj.response.headers?.['Retry-After'];

  if (retryAfter) {
    return `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${String(retryAfter)} giây.`;
  }

  return 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít giây.';
}
