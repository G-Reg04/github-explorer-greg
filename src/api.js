// API client: GitHub REST (public). Handles errors, rate limiting, and sessionStorage cache.

const API_BASE = 'https://api.github.com';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const cacheKey = (key) => `ghx-cache:${key}`;

const getCache = (key) => {
  try {
    const raw = sessionStorage.getItem(cacheKey(key));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(cacheKey(key));
      return null;
    }
    return data.value;
  } catch {
    return null;
  }
};

const setCache = (key, value) => {
  try {
    sessionStorage.setItem(
      cacheKey(key),
      JSON.stringify({ timestamp: Date.now(), value })
    );
  } catch {
    // ignore quota errors
  }
};

const parseRateLimit = (headers) => {
  const remaining = Number(headers.get('X-RateLimit-Remaining'));
  const resetUnix = Number(headers.get('X-RateLimit-Reset'));
  const resetAt = Number.isFinite(resetUnix) ? new Date(resetUnix * 1000) : null;
  return { remaining, resetAt };
};

const fetchJson = async (url, { cacheId } = {}) => {
  if (cacheId) {
    const cached = getCache(cacheId);
    if (cached) return cached;
  }
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  const rate = parseRateLimit(res.headers);

  if (!res.ok) {
    let errorPayload = null;
    try {
      errorPayload = await res.json();
    } catch {
      // no-op
    }
    const error = new Error(errorPayload?.message || `Erro ${res.status}`);
    error.status = res.status;
    error.rate = rate;
    throw error;
  }
  const data = await res.json();
  if (cacheId) setCache(cacheId, data);
  return data;
};

export const getUser = async (username) => {
  if (!username) throw new Error('username obrigatório');
  const url = `${API_BASE}/users/${encodeURIComponent(username)}`;
  return fetchJson(url, { cacheId: `user:${username}` });
};

export const getUserRepos = async ({ username, page = 1, perPage = 10, sort = 'updated' }) => {
  if (!username) throw new Error('username obrigatório');
  const url = new URL(`${API_BASE}/users/${encodeURIComponent(username)}/repos`);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort', sort);
  return fetchJson(url.toString(), { cacheId: `repos:${username}:${page}:${perPage}:${sort}` });
};


