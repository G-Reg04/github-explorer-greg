import { getUser, getUserRepos } from './api.js';
import { debounce, formatDate, formatNumber, clamp } from './utils.js';
import { readStateFromQuery, writeStateToQuery, DEFAULT_STATE } from './state.js';

// Elements
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const el = {
  themeToggle: null,
  form: null,
  input: null,
  status: null,
  profileSection: null,
  profileContent: null,
  controlsSection: null,
  reposSection: null,
  reposList: null,
  prevPage: null,
  nextPage: null,
  pageIndicator: null,
  filterLanguage: null,
  filterStars: null,
  sortBy: null,
};

const hydrateElements = () => {
  el.themeToggle = $('#theme-toggle');
  el.form = $('#search-form');
  el.input = $('#username');
  el.status = $('#status-region');
  el.profileSection = $('#profile');
  el.profileContent = $('#profile-content');
  el.controlsSection = $('#controls');
  el.reposSection = $('#repos');
  el.reposList = $('#repos-list');
  el.prevPage = $('#prev-page');
  el.nextPage = $('#next-page');
  el.pageIndicator = $('#page-indicator');
  el.filterLanguage = $('#filter-language');
  el.filterStars = $('#filter-stars');
  el.sortBy = $('#sort-by');
};

// Theme
const THEME_KEY = 'ghx-theme';
const getSystemPrefersDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const updateThemeMeta = (isDark) => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? '#0b1220' : '#0ea5e9');
};

const updateThemeButton = (mode) => {
  // Tenta encontrar o botão se el.themeToggle não existe ainda
  const button = el.themeToggle || document.getElementById('theme-toggle');
  if (!button) return;
  
  const span = button.querySelector('span.i');
  if (!span) return;
  
  const icons = {
    'light': '☀️',
    'dark': '🌙', 
    'system': '🌓'
  };
  
  span.textContent = icons[mode] || '🌓';
  button.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
};

const applyTheme = (mode) => {
  const root = document.documentElement;
  const isDark = mode === 'dark' || (mode === 'system' && getSystemPrefersDark());
  
  // Debug: log para verificar se está funcionando
  console.log(`🎨 Aplicando tema: ${mode}, isDark: ${isDark}`);
  
  root.classList.toggle('dark', isDark);
  document.body?.classList.toggle('dark', isDark);
  localStorage.setItem(THEME_KEY, mode); // Salva o modo real escolhido pelo usuário
  updateThemeButton(mode);
  updateThemeMeta(isDark);
  
  // Debug: verificar se as classes foram aplicadas
  console.log(`🔍 Classes no html:`, root.className);
};

const initTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved || 'dark'); // Padrão é dark conforme solicitado
};

const handleThemeToggle = () => {
  const current = localStorage.getItem(THEME_KEY) || 'dark';
  // Ciclo: dark -> light -> system -> dark
  const cycle = {
    'dark': 'light',
    'light': 'system', 
    'system': 'dark'
  };
  applyTheme(cycle[current] || 'dark');
};

// State
let state = { ...DEFAULT_STATE };
let lastRepos = [];

const show = (sectionEl, shouldShow) => {
  sectionEl.classList.toggle('hidden', !shouldShow);
};

const setStatus = (message, tone = 'info') => {
  if (!el.status) return;
  if (!message) {
    el.status.classList.add('hidden');
    el.status.textContent = '';
    return;
  }
  const toneClasses = {
    info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/40 dark:bg-sky-900/30 dark:text-sky-100',
    error: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-100',
    warn: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-100',
  };
  el.status.className = `rounded-md border p-3 text-sm ${toneClasses[tone] || toneClasses.info}`;
  el.status.textContent = message;
  el.status.classList.remove('hidden');
};

const renderProfile = (user) => {
  if (!user) return;
  const avatar = document.createElement('img');
  avatar.src = user.avatar_url;
  avatar.alt = `Avatar de ${user.login}`;
  avatar.loading = 'lazy';
  avatar.width = 96;
  avatar.height = 96;
  avatar.className = 'h-24 w-24 rounded-full ring-1 ring-slate-200 dark:ring-slate-700';

  const name = document.createElement('div');
  name.className = 'text-lg font-semibold';
  name.textContent = user.name || user.login;

  const meta = document.createElement('div');
  meta.className = 'text-sm text-slate-600 dark:text-slate-400';
  meta.textContent = user.bio || '';

  const link = document.createElement('a');
  link.href = user.html_url;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.className = 'inline-flex items-center gap-1 text-sm text-sky-700 underline decoration-sky-500 hover:text-sky-800 dark:text-sky-400';
  link.textContent = `@${user.login}`;

  el.profileContent.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'flex items-start gap-4';
  row.append(avatar);
  const col = document.createElement('div');
  col.className = 'flex-1 space-y-1';
  col.append(name, meta, link);
  row.append(col);
  el.profileContent.append(row);
  show(el.profileSection, true);
};

const computeLanguages = (repos) => {
  const set = new Set();
  repos.forEach((r) => {
    if (r.language) set.add(r.language);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

const hydrateLanguageFilter = (repos) => {
  const languages = computeLanguages(repos);
  el.filterLanguage.innerHTML = '<option value="">Todas</option>';
  for (const lang of languages) {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = lang;
    el.filterLanguage.append(opt);
  }
  if (state.lang) el.filterLanguage.value = state.lang;
};

const renderRepos = (repos) => {
  // Client-side filters
  let filtered = Array.from(repos);
  if (state.lang) filtered = filtered.filter((r) => r.language === state.lang);
  if (state.stars > 0) filtered = filtered.filter((r) => (r.stargazers_count || 0) >= state.stars);

  // Client-side sort
  if (state.sort === 'stars') {
    filtered.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
  } else {
    filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  el.reposList.innerHTML = '';
  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400';
    empty.textContent = 'Nenhum repositório encontrado com os filtros atuais.';
    el.reposList.append(empty);
    return;
  }

  for (const repo of filtered) {
    const li = document.createElement('li');
    li.className = 'rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40';

    const top = document.createElement('div');
    top.className = 'flex items-start justify-between gap-3';
    const name = document.createElement('a');
    name.href = repo.html_url;
    name.target = '_blank';
    name.rel = 'noreferrer';
    name.className = 'text-sm font-semibold text-sky-700 underline decoration-sky-500 hover:text-sky-800 dark:text-sky-400';
    name.textContent = repo.name;

    const lang = document.createElement('span');
    lang.className = 'rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300';
    lang.textContent = repo.language || '—';
    top.append(name, lang);

    const desc = document.createElement('p');
    desc.className = 'mt-2 text-sm text-slate-600 dark:text-slate-400';
    desc.textContent = repo.description || '';

    const meta = document.createElement('div');
    meta.className = 'mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400';
    const stars = document.createElement('span');
    stars.textContent = `⭐ ${formatNumber(repo.stargazers_count || 0)}`;
    const updated = document.createElement('span');
    updated.textContent = `Atualizado ${formatDate(repo.updated_at)}`;
    meta.append(stars, updated);

    li.append(top, desc, meta);
    el.reposList.append(li);
  }
};

const setPageControls = ({ page, hasNext }) => {
  el.pageIndicator.textContent = String(page);
  el.prevPage.disabled = page <= 1;
  el.nextPage.disabled = !hasNext; // optimistic; GitHub doesn't return total count here
};

const loadAll = async () => {
  const username = state.u?.trim();
  if (!username) {
    setStatus('Digite um usuário do GitHub para começar.');
    show(el.profileSection, false);
    show(el.controlsSection, false);
    show(el.reposSection, false);
    return;
  }

  try {
    setStatus('Carregando perfil…');
    const user = await getUser(username);
    renderProfile(user);
    setStatus('Carregando repositórios…');
    const repos = await getUserRepos({ username, page: clamp(state.page, 1, 100), perPage: 10, sort: 'updated' });
    lastRepos = Array.isArray(repos) ? repos : [];
    hydrateLanguageFilter(lastRepos);
    renderRepos(lastRepos);
    setPageControls({ page: state.page, hasNext: lastRepos.length === 10 });
    setStatus('');
    show(el.controlsSection, true);
    show(el.reposSection, true);
  } catch (err) {
    const status = err?.status;
    if (status === 404) {
      setStatus('Usuário não encontrado (404).', 'error');
      show(el.profileSection, false);
      show(el.controlsSection, false);
      show(el.reposSection, false);
      return;
    }
    if (status === 403 && err?.rate?.resetAt) {
      const mins = Math.max(1, Math.ceil((err.rate.resetAt.getTime() - Date.now()) / 60000));
      setStatus(`Limite de requisições atingido. Tente novamente em ~${mins} min.`, 'warn');
      show(el.profileSection, false);
      show(el.controlsSection, false);
      show(el.reposSection, false);
      return;
    }
    setStatus(err?.message || 'Erro ao carregar dados.', 'error');
    show(el.profileSection, false);
    show(el.controlsSection, false);
    show(el.reposSection, false);
  }
};

// Event handlers
const handleSearchSubmit = (event) => {
  event?.preventDefault?.();
  const next = { ...state, u: el.input.value.trim(), page: 1 };
  state = writeStateToQuery(next);
  loadAll();
};

const debouncedInput = debounce(() => {
  if (!document.activeElement || document.activeElement !== el.input) return; // avoid firing on programmatic changes
  const value = el.input.value.trim();
  if (!value) return;
  const next = { ...state, u: value, page: 1 };
  state = writeStateToQuery(next);
  loadAll();
}, 400);

const handlePrevPage = () => {
  const page = clamp((state.page || 1) - 1, 1, 100);
  state = writeStateToQuery({ ...state, page });
  loadAll();
};

const handleNextPage = () => {
  const page = clamp((state.page || 1) + 1, 1, 100);
  state = writeStateToQuery({ ...state, page });
  loadAll();
};

const applyFiltersAndSort = () => {
  state = writeStateToQuery({ ...state, lang: el.filterLanguage.value, stars: Number(el.filterStars.value) || 0, sort: el.sortBy.value }, true);
  renderRepos(lastRepos);
};

// Init
const init = () => {
  hydrateElements();
  initTheme();
  el.themeToggle?.addEventListener('click', handleThemeToggle);

  // Form
  el.form?.addEventListener('submit', handleSearchSubmit);
  el.input?.addEventListener('input', debouncedInput);

  // Pagination
  el.prevPage?.addEventListener('click', handlePrevPage);
  el.nextPage?.addEventListener('click', handleNextPage);

  // Filters
  el.filterLanguage?.addEventListener('change', applyFiltersAndSort);
  el.filterStars?.addEventListener('change', applyFiltersAndSort);
  el.sortBy?.addEventListener('change', applyFiltersAndSort);

  // Load state
  state = readStateFromQuery();
  // hydrate controls
  el.input.value = state.u || '';
  el.filterStars.value = String(state.stars || 0);
  el.sortBy.value = state.sort || 'updated';

  // Handle back/forward
  window.addEventListener('popstate', () => {
    state = readStateFromQuery();
    el.input.value = state.u || '';
    el.filterStars.value = String(state.stars || 0);
    el.sortBy.value = state.sort || 'updated';
    loadAll();
  });

  loadAll();
};

document.addEventListener('DOMContentLoaded', init);


