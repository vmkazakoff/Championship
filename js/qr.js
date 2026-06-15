const QR_DOT_COLOR = '#1f2937';
const QR_SIZE = 168;

function getThemeHex(config, key, fallback) {
  if (!config || !config[key]) return fallback;
  const parsed = typeof parseColorValue === 'function' ? parseColorValue(config[key]) : null;
  if (parsed && parsed.type === 'hex') return parsed.hex;
  return fallback;
}

function renderStyledQR(container, url) {
  container.innerHTML = '';
  const qr = new QRCodeStyling({
    width: QR_SIZE,
    height: QR_SIZE,
    type: 'canvas',
    data: url,
    margin: 4,
    qrOptions: { errorCorrectionLevel: 'M' },
    dotsOptions: {
      color: QR_DOT_COLOR,
      type: 'rounded',
    },
    cornersSquareOptions: {
      color: QR_DOT_COLOR,
      type: 'extra-rounded',
    },
    cornersDotOptions: {
      color: QR_DOT_COLOR,
      type: 'dot',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
  });
  qr.append(container);
}

function formatUrlForWrap(url) {
  return escapeHtml(url)
    .replace(/:\/\//g, '://<wbr>')
    .replace(/\//g, '/<wbr>');
}

function buildLinksModalContent(container, config) {
  container.innerHTML = '';

  const links = config.links || [];
  const accentHex = getThemeHex(config, 'colorPrimary', '#2563eb');

  if (links.length === 0) {
    container.innerHTML =
      '<p class="text-center text-gray-500 py-12">Ссылки на ИИ-сервисы не настроены в таблице «Конфиг»</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';

  links.forEach(function (link) {
    const card = document.createElement('a');
    card.href = link.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.title = link.url;
    card.style.setProperty('--qr-accent', accentHex);
    card.className =
      'group block rounded-xl border border-gray-200 bg-white p-6 text-center no-underline text-inherit ' +
      'transition-colors duration-300 hover:border-gray-300';

    card.innerHTML =
      '<h4 class="text-lg font-semibold mb-5 transition-colors duration-300 group-hover:text-[var(--qr-accent)]">' +
      escapeHtml(link.title) +
      '</h4>' +
      '<div class="flex justify-center mb-5"><div class="qr-canvas-host"></div></div>' +
      '<span class="block text-sm text-gray-500 break-words transition-colors duration-300 group-hover:text-[var(--qr-accent)]">' +
      formatUrlForWrap(link.url) +
      '</span>';

    renderStyledQR(card.querySelector('.qr-canvas-host'), link.url);
    grid.appendChild(card);
  });

  container.appendChild(grid);
  applyTheme(config);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
