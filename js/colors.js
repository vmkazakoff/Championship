const THEME_ROLES = {
  'page-bg': { key: 'colorBackground', prefix: 'bg' },
  'page-text': { key: 'colorText', prefix: 'text' },
  'header-bg': { key: 'colorPrimary', prefix: 'bg' },
  'card-bg': { key: 'colorSurface', prefix: 'bg' },
  'muted-text': { key: 'colorTextMuted', prefix: 'text' },
  'primary-bg': { key: 'colorPrimary', prefix: 'bg' },
  'primary-dark-bg': { key: 'colorPrimaryDark', prefix: 'bg' },
  'accent-bg': { key: 'colorAccent', prefix: 'bg' },
  'accent-text': { key: 'colorAccent', prefix: 'text' },
  'assignment-bg': { key: 'colorPrimary', prefix: 'bg' },
  rounded: { key: 'borderRadius', prefix: 'rounded' },
};

const STYLE_PROPS = {
  bg: 'backgroundColor',
  text: 'color',
  border: 'borderColor',
};

const TAILWIND_PALETTE = {
  'red-50': '#fef2f2',
  'red-100': '#fee2e2',
  'red-200': '#fecaca',
  'red-300': '#fca5a5',
  'red-400': '#f87171',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'red-700': '#b91c1c',
  'red-800': '#991b1b',
  'red-900': '#7f1d1d',
  'blue-50': '#eff6ff',
  'blue-100': '#dbeafe',
  'blue-200': '#bfdbfe',
  'blue-300': '#93c5fd',
  'blue-400': '#60a5fa',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'blue-700': '#1d4ed8',
  'blue-800': '#1e40af',
  'blue-900': '#1e3a8a',
  'gray-50': '#f9fafb',
  'gray-100': '#f3f4f6',
  'gray-200': '#e5e7eb',
  'gray-300': '#d1d5db',
  'gray-400': '#9ca3af',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
  'gray-700': '#374151',
  'gray-800': '#1f2937',
  'gray-900': '#111827',
  white: '#ffffff',
  black: '#000000',
  orange: '#f97316',
  'orange-500': '#f97316',
  'orange-600': '#ea580c',
};

function parseColorValue(value) {
  if (!value) return null;
  const bracket = value.match(/^\[#([0-9A-Fa-f]{3,8})\]$/);
  if (bracket) return { type: 'hex', hex: '#' + bracket[1] };
  if (value.startsWith('#')) return { type: 'hex', hex: value };
  if (TAILWIND_PALETTE[value]) return { type: 'hex', hex: TAILWIND_PALETTE[value] };
  return { type: 'class', token: value };
}

function applyThemeValue(el, prefix, value) {
  const parsed = parseColorValue(value);
  if (!parsed) return;

  if (parsed.type === 'hex') {
    const prop = STYLE_PROPS[prefix];
    if (prop) el.style[prop] = parsed.hex;
    return;
  }

  el.classList.add(prefix + '-' + parsed.token);
}

function getBorderRadiusClasses(config) {
  const value = config && config.borderRadius;
  if (!value || value === 'none' || value === '0') {
    return { all: '', top: '', bottom: '' };
  }

  const parsed = parseColorValue(value);
  if (parsed && parsed.type === 'class') {
    const token = parsed.token;
    return {
      all: 'rounded-' + token,
      top: 'rounded-t-' + token,
      bottom: 'rounded-b-' + token,
    };
  }

  return { all: '', top: '', bottom: '' };
}

function applyTheme(config) {
  document.querySelectorAll('[data-theme]').forEach(function (el) {
    const roles = el.getAttribute('data-theme').split(/\s+/);
    roles.forEach(function (role) {
      const mapping = THEME_ROLES[role];
      if (!mapping || !config[mapping.key]) return;
      applyThemeValue(el, mapping.prefix, config[mapping.key]);
    });
  });
}
