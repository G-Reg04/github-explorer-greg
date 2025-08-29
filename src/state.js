// Manage URL querystring state (?u=...&page=...&lang=...&stars=...&sort=...)

const DEFAULTS = {
  u: '',
  page: 1,
  lang: '',
  stars: 0,
  sort: 'updated', // 'updated' | 'stars'
};

const parseIntSafe = (value, fallback) => {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
};

export const readStateFromQuery = () => {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  return {
    u: params.get('u') || DEFAULTS.u,
    page: parseIntSafe(params.get('page'), DEFAULTS.page),
    lang: params.get('lang') || DEFAULTS.lang,
    stars: parseIntSafe(params.get('stars'), DEFAULTS.stars),
    sort: params.get('sort') === 'stars' ? 'stars' : DEFAULTS.sort,
  };
};

export const writeStateToQuery = (nextState, replace = false) => {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const state = { ...DEFAULTS, ...nextState };
  // Only set if different from defaults to keep URL clean
  if (state.u) params.set('u', state.u);
  else params.delete('u');

  if (state.page && state.page !== DEFAULTS.page) params.set('page', String(state.page));
  else params.delete('page');

  if (state.lang) params.set('lang', state.lang);
  else params.delete('lang');

  if (state.stars && state.stars !== DEFAULTS.stars) params.set('stars', String(state.stars));
  else params.delete('stars');

  if (state.sort && state.sort !== DEFAULTS.sort) params.set('sort', state.sort);
  else params.delete('sort');

  const newUrl = `${url.pathname}?${params.toString()}`;
  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
  return state;
};

export const DEFAULT_STATE = DEFAULTS;


