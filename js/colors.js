const THEME_ROLES = {
  'page-bg': { key: 'colorBackground', prefix: 'bg' },
  'page-text': { key: 'colorText', prefix: 'text' },
  'header-bg': { key: 'colorPrimary', prefix: 'bg' },
  'card-bg': { key: 'colorSurface', prefix: 'bg' },
  'muted-text': { key: 'colorTextMuted', prefix: 'text' },
  'primary-bg': { key: 'colorPrimary', prefix: 'bg' },
  'accent-bg': { key: 'colorAccent', prefix: 'bg' },
  'accent-text': { key: 'colorAccent', prefix: 'text' },
  'assignment-bg': { key: 'colorPrimary', prefix: 'bg' },
  rounded: { key: 'borderRadius', prefix: 'rounded' },
};

const STYLE_PROPS = {
  bg: 'backgroundColor',
  text: 'color',
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

function resolveThemeHex(config, key, fallback) {
  const parsed = config && config[key] ? parseColorValue(config[key]) : null;
  if (parsed && parsed.type === 'hex') return parsed.hex;
  return fallback;
}

function hexToRgb(hex) {
  let value = String(hex).replace('#', '');
  if (value.length === 3) {
    value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
  }
  if (value.length >= 6) value = value.slice(0, 6);
  const number = parseInt(value, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function rgbToHex(red, green, blue) {
  return (
    '#' +
    [red, green, blue]
      .map(function (channel) {
        const clamped = Math.max(0, Math.min(255, Math.round(channel)));
        const pair = clamped.toString(16);
        return pair.length === 1 ? '0' + pair : pair;
      })
      .join('')
  );
}

function mixHex(fromHex, toHex, weight) {
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);
  return rgbToHex(
    from.r + (to.r - from.r) * weight,
    from.g + (to.g - from.g) * weight,
    from.b + (to.b - from.b) * weight
  );
}

function channelLuminance(channel) {
  const value = channel / 255;
  if (value <= 0.03928) return value / 12.92;
  return Math.pow((value + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

function isDarkHex(hex) {
  return relativeLuminance(hex) < 0.4;
}

function applyDerivedTheme(config) {
  const surface = resolveThemeHex(config, 'colorSurface', '#ffffff');
  const page = resolveThemeHex(config, 'colorBackground', '#f9fafb');
  const text = resolveThemeHex(config, 'colorText', '#1f2937');
  const primary = resolveThemeHex(config, 'colorPrimary', '#0066cc');
  const muted = resolveThemeHex(config, 'colorTextMuted', '#6b7280');
  const dark = isDarkHex(surface);
  const lift = dark ? '#ffffff' : '#000000';
  const controlBg = mixHex(surface, lift, dark ? 0.16 : 0.1);
  const modalShadow = isDarkHex(page)
    ? '0 0 0 1px ' + mixHex(surface, '#ffffff', 0.18) + ', 0 28px 80px rgba(0,0,0,.75), 0 0 48px rgba(255,255,255,.08)'
    : '0 24px 60px rgba(15,23,42,.28), 0 8px 24px rgba(15,23,42,.18)';

  const root = document.documentElement;
  root.style.setProperty('--theme-text', text);
  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--theme-muted', muted);
  root.style.setProperty('--theme-line', mixHex(surface, lift, dark ? 0.12 : 0.1));
  root.style.setProperty('--theme-hover', mixHex(surface, lift, dark ? 0.08 : 0.04));
  root.style.setProperty('--theme-soft', mixHex(surface, lift, dark ? 0.06 : 0.03));
  root.style.setProperty('--theme-track', mixHex(surface, lift, dark ? 0.18 : 0.1));
  root.style.setProperty('--theme-control-bg', controlBg);
  root.style.setProperty('--theme-control-text', isDarkHex(controlBg) ? '#ffffff' : '#111827');
  root.style.setProperty('--theme-control-hover', mixHex(controlBg, lift, 0.1));
  root.style.setProperty('--theme-field-bg', dark ? mixHex(surface, '#ffffff', 0.08) : '#ffffff');
  root.style.setProperty('--theme-field-text', dark ? text : '#111827');
  root.style.setProperty('--theme-modal-shadow', modalShadow);
  root.classList.toggle('theme-dark', dark);
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
  applyDerivedTheme(config);
  document.querySelectorAll('[data-theme]').forEach(function (el) {
    const roles = el.getAttribute('data-theme').split(/\s+/);
    roles.forEach(function (role) {
      const mapping = THEME_ROLES[role];
      if (!mapping || !config[mapping.key]) return;
      applyThemeValue(el, mapping.prefix, config[mapping.key]);
    });
  });
}
