// Utils: debounce, formatters (dates, numbers)

/**
 * Debounce helper
 * @param {Function} fn
 * @param {number} delayMs
 * @returns {Function}
 */
export const debounce = (fn, delayMs = 400) => {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn.apply(null, args), delayMs);
  };
};

/**
 * Format ISO date to locale short string
 * @param {string|number|Date} dateInput
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(navigator.language || 'pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

/**
 * Format number with compact notation
 * @param {number} value
 */
export const formatNumber = (value) => {
  if (typeof value !== 'number') return '';
  return new Intl.NumberFormat(navigator.language || 'pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Clamp value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export const clamp = (value, min, max) => {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};


