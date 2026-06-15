const appState = {
  userRole: null,
  teamName: null,
  currentAssignment: null,
  submittedAnswers: new Set(),
  teamSubmissions: {},
  bootstrap: null,
  assignmentsPage: 0,
};

const els = {
  pageTitle: document.getElementById('pageTitle'),
  clientName: document.getElementById('clientName'),
  favicon: document.getElementById('favicon'),
  logoWrap: document.getElementById('logoWrap'),
  logo: document.getElementById('logo'),
  teamNameLabel: document.getElementById('teamNameLabel'),
  progressSentLabel: document.getElementById('progressSentLabel'),
  progressBar: document.getElementById('progressBar'),
  progressPercentage: document.getElementById('progressPercentage'),
  totalAssignments: document.getElementById('totalAssignments'),
  assignmentsViewport: document.getElementById('assignmentsViewport'),
  assignmentsTrack: document.getElementById('assignmentsTrack'),
  assignmentsPager: document.getElementById('assignmentsPager'),
  assignmentsDots: document.getElementById('assignmentsDots'),
  pagerPrev: document.getElementById('pagerPrev'),
  pagerNext: document.getElementById('pagerNext'),
  leaderboard: document.getElementById('leaderboard'),
  leaderboardSection: document.getElementById('leaderboardSection'),
  refreshButton: document.getElementById('refreshButton'),
  refreshIcon: document.getElementById('refreshIcon'),
  authModal: document.getElementById('authModal'),
  authButton: document.getElementById('authButton'),
  loginButton: document.getElementById('loginButton'),
  cancelButton: document.getElementById('cancelButton'),
  teamNameInput: document.getElementById('teamNameInput'),
  teamNameField: document.getElementById('teamNameField'),
  answerModal: document.getElementById('answerModal'),
  answerModalTitle: document.getElementById('answerModalTitle'),
  answerModalDescription: document.getElementById('answerModalDescription'),
  answerText: document.getElementById('answerText'),
  answerWarning: document.getElementById('answerWarning'),
  answerResultSection: document.getElementById('answerResultSection'),
  answerScoreDisplay: document.getElementById('answerScoreDisplay'),
  answerFeedbackWrap: document.getElementById('answerFeedbackWrap'),
  answerFeedbackDisplay: document.getElementById('answerFeedbackDisplay'),
  submitAnswerButton: document.getElementById('submitAnswerButton'),
  cancelAnswerButton: document.getElementById('cancelAnswerButton'),
  linksModal: document.getElementById('linksModal'),
  linksModalContent: document.getElementById('linksModalContent'),
  qrButton: document.getElementById('qrButton'),
  closeLinksModal: document.getElementById('closeLinksModal'),
  closeLinksModalTop: document.getElementById('closeLinksModalTop'),
  splashScreen: document.getElementById('splashScreen'),
};

let isFirstLoad = true;
const MIN_CARD_WIDTH = 165;
const CARD_GAP = 16;

document.addEventListener('DOMContentLoaded', function () {
  setupEventListeners();
  restoreSession();
  loadData();
  setInterval(loadData, REFRESH_INTERVAL_MS);

  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (appState.bootstrap) renderAssignments(appState.bootstrap);
    }, 150);
  });
});

function setupEventListeners() {
  els.authButton.addEventListener('click', showAuthModal);
  els.cancelButton.addEventListener('click', hideAuthModal);
  els.loginButton.addEventListener('click', handleLogin);
  els.qrButton.addEventListener('click', showLinksModal);
  els.closeLinksModal.addEventListener('click', hideLinksModal);
  els.closeLinksModalTop.addEventListener('click', hideLinksModal);
  els.cancelAnswerButton.addEventListener('click', hideAnswerModal);
  els.submitAnswerButton.addEventListener('click', function (e) {
    e.preventDefault();
    handleSubmitAnswer();
  });
  els.refreshButton.addEventListener('click', loadData);
  els.pagerPrev.addEventListener('click', function () {
    goToAssignmentsPage(appState.assignmentsPage - 1);
  });
  els.pagerNext.addEventListener('click', function () {
    goToAssignmentsPage(appState.assignmentsPage + 1);
  });

  document.querySelectorAll('input[name="role"]').forEach(function (radio) {
    radio.addEventListener('change', handleRoleChange);
  });

  els.assignmentsTrack.addEventListener('click', function (e) {
    const btn = e.target.closest('.assignment-btn');
    if (btn) handleAssignmentClick(btn);
  });

  setupAssignmentsSwipe();

  [els.authModal, els.answerModal, els.linksModal].forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
      }
    });
  });
}

function restoreSession() {
  const role = localStorage.getItem('userRole');
  const teamName = localStorage.getItem('teamName');
  if (role) {
    appState.userRole = role;
    appState.teamName = teamName;
    updateRoleUI();
  } else {
    showAuthModal();
  }
}

async function loadData() {
  els.refreshIcon.classList.add('animate-spin-slow');
  try {
    const data = await fetchBootstrap();
    appState.bootstrap = data;
    applyPageMeta(data.config);
    renderAssignments(data);
    applyTheme(data.config);
    updateProgress(data.statistics, data.assignments.length);
    updateLeaderboard(data.teams, data.assignments);
    updateTeamSubmissionStatus(data.teams);
    refreshAnswerModalIfOpen();
    updateRoleUI();
  } catch (err) {
    console.error('loadData:', err);
    els.leaderboard.innerHTML =
      '<div class="text-center py-8 text-red-500"><p>Не удалось загрузить данные. Проверьте подключение.</p></div>';
  } finally {
    els.refreshIcon.classList.remove('animate-spin-slow');
    if (isFirstLoad) {
      isFirstLoad = false;
      hideSplash();
    }
  }
}

function hideSplash() {
  if (!els.splashScreen) return;
  els.splashScreen.classList.add('opacity-0', 'pointer-events-none');
  setTimeout(function () {
    els.splashScreen.classList.add('hidden');
  }, 300);
}

function resolveAssetUrl(url) {
  const value = String(url || '').trim();
  if (!value) return value;
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;

  const pageBase = window.location.pathname.replace(/\/[^/]*$/, '/');
  if (value.startsWith('/')) {
    return window.location.origin + value;
  }

  return pageBase + value.replace(/^\.\//, '');
}

function applyPageMeta(config) {
  const title = config.title || 'Чемпионат по промптингу';
  document.title = title;
  els.pageTitle.textContent = title;

  if (config.clientName) {
    els.clientName.textContent = config.clientName;
    els.clientName.classList.remove('hidden');
  } else {
    els.clientName.classList.add('hidden');
  }

  if (config.faviconUrl) {
    els.favicon.href = resolveAssetUrl(config.faviconUrl);
  }
  if (config.logoUrl) {
    els.logo.src = resolveAssetUrl(config.logoUrl);
    els.logo.alt = '';
    if (config.logoHeight) els.logo.style.height = config.logoHeight;
    els.logoWrap.classList.remove('hidden');
  } else {
    els.logoWrap.classList.add('hidden');
  }
}

function assignmentCardTitle(description, id) {
  const firstLine = String(description || '')
    .split('\n')[0]
    .trim();
  return firstLine || 'Задание ' + id;
}

function getCardsPerPage(availableWidth) {
  if (availableWidth <= 0) return 1;
  return Math.max(1, Math.floor((availableWidth + CARD_GAP) / (MIN_CARD_WIDTH + CARD_GAP)));
}

function getAssignmentPageStarts(total, perPage) {
  if (total <= perPage) return [0];

  const starts = [0];
  const maxStart = total - perPage;
  let s = perPage;

  while (s < maxStart) {
    starts.push(s);
    s += perPage;
  }

  if (starts[starts.length - 1] !== maxStart) {
    starts.push(maxStart);
  }

  return starts;
}

function getTeamSubmission(assignmentId) {
  return appState.teamSubmissions[String(assignmentId)] || null;
}

function renderAssignmentCard(a, completedCount) {
  const title = assignmentCardTitle(a.description, a.id);
  const submitted = appState.submittedAnswers.has(String(a.id));
  const submission = getTeamSubmission(a.id);
  const isCaptain = appState.userRole === 'captain';
  const config = appState.bootstrap && appState.bootstrap.config;
  const radius = getBorderRadiusClasses(config);
  const radiusOverflow = radius.all ? ' overflow-hidden' : '';

  let scoreRow = '';
  if (isCaptain && submitted && submission && submission.score != null) {
    scoreRow =
      '<div class="mt-4 pt-3 border-t border-white/25">' +
      '<div class="text-xs uppercase tracking-wide opacity-70 mb-0.5">Ваш балл</div>' +
      '<div class="text-2xl font-bold leading-none">' +
      submission.score +
      '</div>' +
      '</div>';
  }

  const bodyCore =
    '<div class="flex flex-col flex-grow text-center min-h-[120px]">' +
    '<div class="text-sm opacity-80 mb-1">Задание ' +
    a.id +
    '</div>' +
    '<div class="text-3xl font-bold leading-none mb-1">' +
    completedCount +
    '</div>' +
    '<div class="text-xs opacity-70 mb-3">' +
    teamsSubmittedPhrase(completedCount) +
    '</div>' +
    '<div class="text-sm font-medium opacity-90 leading-snug">' +
    escapeHtml(title) +
    '</div>';

  const body = bodyCore + (isCaptain ? scoreRow : '') + '</div>';

  if (!isCaptain) {
    return (
      '<div class="assignment-card flex flex-col min-w-0' +
      radiusOverflow +
      ' ' +
      radius.all +
      '" data-assignment-id="' +
      a.id +
      '">' +
      '<div data-theme="assignment-bg" class="text-center flex-grow flex flex-col text-white p-4 sm:p-5 min-h-[160px]">' +
      body +
      '</div>' +
      '</div>'
    );
  }

  const actionLabel = submitted ? 'ОТПРАВЛЕНО' : 'ОТПРАВИТЬ';

  return (
    '<button type="button" class="assignment-btn assignment-card group min-w-0 text-left' +
    radiusOverflow +
    ' ' +
    radius.all +
    ' assignment-btn--active' +
    (submitted ? ' assignment-btn--submitted opacity-60 hover:opacity-80' : '') +
    ' cursor-pointer' +
    '" data-assignment="' +
    a.id +
    '">' +
    '<div data-theme="assignment-bg" class="' +
    radius.top +
    ' text-center flex-grow flex flex-col text-white p-4 sm:p-5 min-h-[140px]">' +
    body +
    '</div>' +
    '<div class="' +
    radius.bottom +
    ' w-full py-2.5 px-3 text-sm font-semibold text-center bg-gray-800 text-white transition-colors group-hover:bg-gray-700' +
    '">' +
    actionLabel +
    '</div>' +
    '</button>'
  );
}

function renderAssignments(data) {
  const assignments = data.assignments || [];
  const completed = data.statistics.completedByAssignment || [];

  if (assignments.length === 0) {
    els.assignmentsTrack.innerHTML = '';
    renderAssignmentsPager(0);
    return;
  }

  const prevPage = appState.assignmentsPage || 0;
  const available = els.assignmentsViewport.clientWidth;

  if (available <= 0) {
    requestAnimationFrame(function () {
      if (appState.bootstrap) renderAssignments(appState.bootstrap);
    });
    return;
  }

  const cardsPerPage = getCardsPerPage(available);
  const items = assignments.map(function (a, i) {
    return { assignment: a, index: i };
  });
  const fitsOnOnePage = items.length <= cardsPerPage;
  const pageStarts = fitsOnOnePage ? [0] : getAssignmentPageStarts(items.length, cardsPerPage);
  const pageCount = pageStarts.length;

  appState.assignmentsPage = fitsOnOnePage ? 0 : Math.min(prevPage, pageCount - 1);
  appState.cardsPerPage = cardsPerPage;

  els.assignmentsTrack.innerHTML = pageStarts
    .map(function (start) {
      const columns = fitsOnOnePage ? items.length : cardsPerPage;
      const slots = [];

      if (fitsOnOnePage) {
        items.forEach(function (item) {
          const count = completed[item.index] != null ? completed[item.index] : 0;
          slots.push(renderAssignmentCard(item.assignment, count));
        });
      } else {
        for (let col = 0; col < cardsPerPage; col++) {
          const item = items[start + col];
          if (item) {
            const count = completed[item.index] != null ? completed[item.index] : 0;
            slots.push(renderAssignmentCard(item.assignment, count));
          } else {
            slots.push('<div class="assignment-card-placeholder" aria-hidden="true"></div>');
          }
        }
      }

      return (
        '<div class="assignment-page shrink-0 w-full grid py-1" style="grid-template-columns: repeat(' +
        columns +
        ', minmax(0, 1fr)); gap: ' +
        CARD_GAP +
        'px">' +
        slots.join('') +
        '</div>'
      );
    })
    .join('');

  if (appState.bootstrap && appState.bootstrap.config) {
    applyTheme(appState.bootstrap.config);
    applyPagerDotColors(appState.bootstrap.config);
  }

  renderAssignmentsPager(pageCount);
  goToAssignmentsPage(appState.assignmentsPage, false);
}

function renderAssignmentsPager(pageCount) {
  if (pageCount <= 1) {
    els.assignmentsPager.classList.add('hidden');
    els.assignmentsPager.classList.remove('flex');
    els.assignmentsDots.innerHTML = '';
    return;
  }

  els.assignmentsPager.classList.remove('hidden');
  els.assignmentsPager.classList.add('flex');

  els.assignmentsDots.innerHTML = Array.from({ length: pageCount }, function (_, i) {
    return (
      '<button type="button" class="pager-dot' +
      (i === appState.assignmentsPage ? ' active' : '') +
      '" data-page="' +
      i +
      '" aria-label="Страница ' +
      (i + 1) +
      '"></button>'
    );
  }).join('');

  els.assignmentsDots.querySelectorAll('.pager-dot').forEach(function (dot) {
    dot.addEventListener('click', function () {
      goToAssignmentsPage(Number(dot.dataset.page));
    });
  });

  updatePagerButtons(pageCount);
}

function goToAssignmentsPage(index, animate) {
  const pages = els.assignmentsTrack.querySelectorAll('.assignment-page');
  const pageCount = pages.length;
  if (pageCount === 0) return;

  const next = Math.max(0, Math.min(index, pageCount - 1));
  appState.assignmentsPage = next;

  const offset = next * els.assignmentsViewport.clientWidth;
  if (animate === false) {
    els.assignmentsTrack.style.transition = 'none';
  }
  els.assignmentsTrack.style.transform = 'translateX(-' + offset + 'px)';
  if (animate === false) {
    requestAnimationFrame(function () {
      els.assignmentsTrack.style.transition = '';
    });
  }

  els.assignmentsDots.querySelectorAll('.pager-dot').forEach(function (dot, i) {
    dot.classList.toggle('active', i === next);
  });

  if (appState.bootstrap && appState.bootstrap.config) {
    applyPagerDotColors(appState.bootstrap.config);
  }

  updatePagerButtons(pageCount);
}

function updatePagerButtons(pageCount) {
  const onFirst = appState.assignmentsPage <= 0;
  const onLast = appState.assignmentsPage >= pageCount - 1;
  els.pagerPrev.disabled = onFirst;
  els.pagerNext.disabled = onLast;
  els.pagerPrev.classList.toggle('opacity-40', onFirst);
  els.pagerNext.classList.toggle('opacity-40', onLast);
}

function applyPagerDotColors(config) {
  const primary = config.colorPrimary || 'gray-500';
  const parsed = typeof parseColorValue === 'function' ? parseColorValue(primary) : null;
  let activeColor = '#6b7280';
  if (parsed && parsed.type === 'hex') activeColor = parsed.hex;

  els.assignmentsDots.querySelectorAll('.pager-dot').forEach(function (dot) {
    dot.style.backgroundColor = dot.classList.contains('active') ? activeColor : '#d1d5db';
  });
}

function setupAssignmentsSwipe() {
  let startX = 0;
  let dragging = false;

  els.assignmentsViewport.addEventListener(
    'touchstart',
    function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      dragging = true;
    },
    { passive: true },
  );

  els.assignmentsViewport.addEventListener(
    'touchend',
    function (e) {
      if (!dragging || e.changedTouches.length !== 1) return;
      dragging = false;
      const diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) < 50) return;
      if (diff < 0) goToAssignmentsPage(appState.assignmentsPage + 1);
      else goToAssignmentsPage(appState.assignmentsPage - 1);
    },
    { passive: true },
  );
}

function pluralTeams(n) {
  const abs = n % 100;
  const mod10 = abs % 10;
  if (abs > 10 && abs < 20) return 'команд';
  if (mod10 > 1 && mod10 < 5) return 'команды';
  if (mod10 === 1) return 'команда';
  return 'команд';
}

function formatTeamsCountLabel(n) {
  return n + ' ' + pluralTeams(n);
}

function teamsSubmittedPhrase(n) {
  const abs = n % 100;
  const mod10 = abs % 10;
  const verb = abs === 11 || mod10 !== 1 ? 'сдали' : 'сдала';
  return pluralTeams(n) + ' ' + verb;
}

function updateProgress(statistics, assignmentCount) {
  const totalTeams = statistics.totalTeams || 0;
  const completed = statistics.completedByAssignment || [];
  const totalDone = completed.reduce(function (sum, n) {
    return sum + n;
  }, 0);
  const maxPossible = totalTeams * assignmentCount;
  const pct = maxPossible > 0 ? Math.round((totalDone / maxPossible) * 100) : 0;

  els.progressSentLabel.textContent = formatTeamsCountLabel(totalTeams);
  els.progressBar.style.width = pct + '%';
  els.progressPercentage.textContent = pct + '%';
  els.totalAssignments.textContent = totalDone + ' из ' + maxPossible + ' заданий';
}

function updateLeaderboard(teams, assignments) {
  const showScores = assignments.some(function (a) {
    return a.showScores;
  });

  if (!showScores) {
    els.leaderboard.innerHTML =
      '<div class="text-center py-8" data-theme="muted-text"><p>Баллы объявят позже</p></div>';
    return;
  }

  if (!teams || teams.length === 0) {
    els.leaderboard.innerHTML =
      '<div class="text-center py-8" data-theme="muted-text"><p>Пока нет ни одной команды</p></div>';
    return;
  }

  const sorted = teams.slice().sort(function (a, b) {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.completedAssignments !== a.completedAssignments) return b.completedAssignments - a.completedAssignments;
    if (a.lastAnswerTime && b.lastAnswerTime) return new Date(a.lastAnswerTime) - new Date(b.lastAnswerTime);
    return new Date(a.registrationTime) - new Date(b.registrationTime);
  });

  els.leaderboard.innerHTML = sorted
    .map(function (team, index) {
      return (
        '<div class="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors">' +
        '<div class="flex items-center gap-4 min-w-0">' +
        '<div class="text-2xl font-bold w-8 shrink-0">' +
        (index + 1) +
        '</div>' +
        '<div class="min-w-0">' +
        '<div class="font-bold text-lg truncate">' +
        escapeHtml(team.teamName) +
        '</div>' +
        '<div class="text-sm" data-theme="muted-text">Отправлено заданий: ' +
        team.completedAssignments +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="text-right shrink-0 ml-4">' +
        '<div class="text-xl font-bold" data-theme="accent-text">' +
        team.totalScore +
        '</div>' +
        '<div class="text-sm" data-theme="muted-text">баллов</div>' +
        '</div>' +
        '</div>'
      );
    })
    .join('');

  applyTheme(appState.bootstrap.config);
}

function updateTeamSubmissionStatus(teams) {
  appState.submittedAnswers.clear();
  appState.teamSubmissions = {};

  if (appState.userRole !== 'captain' || !appState.teamName) return;

  const team = teams.find(function (t) {
    return String(t.teamName).trim().toLowerCase() === String(appState.teamName).trim().toLowerCase();
  });

  if (!team || !team.answers) return;

  Object.keys(team.answers).forEach(function (id) {
    const answer = team.answers[id];
    if (!answer) return;

    appState.submittedAnswers.add(String(id));
    appState.teamSubmissions[String(id)] = {
      answer: answer,
      score: team.scores && team.scores[id] != null ? team.scores[id] : null,
      feedback: team.feedback && team.feedback[id] ? team.feedback[id] : null,
    };
  });
}

function formatScoreDisplay(score) {
  if (score == null || score === '') {
    return '<span class="text-4xl font-bold">—</span>';
  }

  return (
    '<span class="text-4xl font-bold">' +
    escapeHtml(String(score)) +
    '</span><span class="text-lg font-semibold opacity-60">/10</span>'
  );
}

function showAnswerResult(score, feedback) {
  if (score == null) {
    els.answerResultSection.classList.add('hidden');
    return;
  }

  els.answerResultSection.classList.remove('hidden');
  els.answerScoreDisplay.innerHTML = formatScoreDisplay(score);

  if (feedback) {
    els.answerFeedbackWrap.classList.remove('hidden');
    els.answerFeedbackDisplay.innerHTML = formatFeedbackHtml(feedback);
  } else {
    els.answerFeedbackWrap.classList.add('hidden');
    els.answerFeedbackDisplay.innerHTML = '';
  }

  if (appState.bootstrap && appState.bootstrap.config) {
    applyTheme(appState.bootstrap.config);
  }
}

function hideAnswerResult() {
  els.answerResultSection.classList.add('hidden');
  els.answerFeedbackWrap.classList.add('hidden');
  els.answerScoreDisplay.innerHTML = formatScoreDisplay(null);
  els.answerFeedbackDisplay.innerHTML = '';
}

function isAnswerModalOpen() {
  return els.answerModal && !els.answerModal.classList.contains('hidden');
}

function refreshAnswerModalIfOpen() {
  if (!isAnswerModalOpen() || !appState.currentAssignment || !appState.bootstrap) return;

  const assignment = (appState.bootstrap.assignments || []).find(function (a) {
    return String(a.id) === String(appState.currentAssignment);
  });
  if (assignment) populateAnswerModal(assignment);
}

function populateAnswerModal(assignment) {
  const id = String(assignment.id);
  const submitted = appState.submittedAnswers.has(id);
  const submission = getTeamSubmission(id);

  els.answerModalTitle.textContent = 'Задание ' + id;
  els.answerModalDescription.textContent = assignment.description;
  hideAnswerResult();

  if (submitted && submission) {
    els.answerText.value = submission.answer;
    els.answerText.disabled = true;
    els.answerWarning.classList.add('hidden');
    els.submitAnswerButton.textContent = 'Закрыть';
    showAnswerResult(submission.score, submission.feedback);
  } else {
    els.answerText.value = '';
    els.answerText.disabled = false;
    els.answerWarning.classList.remove('hidden');
    els.submitAnswerButton.textContent = 'Отправить';
  }
}

function updateRoleUI() {
  if (appState.userRole === 'captain' && appState.teamName) {
    els.teamNameLabel.textContent = '(команда: ' + appState.teamName + ')';
    els.teamNameLabel.classList.remove('hidden');
  } else {
    els.teamNameLabel.classList.add('hidden');
  }

  if (appState.bootstrap) {
    renderAssignments(appState.bootstrap);
  }
}

function showAuthModal() {
  els.authModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideAuthModal() {
  els.authModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

function handleRoleChange(e) {
  if (e.target.value === 'captain') {
    els.teamNameInput.classList.remove('hidden');
  } else {
    els.teamNameInput.classList.add('hidden');
  }
}

async function handleLogin() {
  const selected = document.querySelector('input[name="role"]:checked');
  if (!selected) {
    alert('Пожалуйста, выберите роль');
    return;
  }

  const role = selected.value;
  let teamName = null;

  els.loginButton.disabled = true;
  els.loginButton.textContent = 'Вход…';

  if (role === 'captain') {
    teamName = els.teamNameField.value.trim();
    if (!teamName) {
      alert('Пожалуйста, введите название команды');
      els.loginButton.disabled = false;
      els.loginButton.textContent = 'Войти';
      return;
    }

    try {
      const result = await postAction({ action: 'register', teamName: teamName });
      if (!result.success) {
        alert('Ошибка регистрации');
        els.loginButton.disabled = false;
        els.loginButton.textContent = 'Войти';
        return;
      }
    } catch (err) {
      alert('Ошибка соединения с сервером');
      els.loginButton.disabled = false;
      els.loginButton.textContent = 'Войти';
      return;
    }
  }

  appState.userRole = role;
  appState.teamName = teamName;
  localStorage.setItem('userRole', role);
  if (teamName) localStorage.setItem('teamName', teamName);
  else localStorage.removeItem('teamName');

  hideAuthModal();
  els.loginButton.disabled = false;
  els.loginButton.textContent = 'Войти';
  updateRoleUI();
  loadData();
}

function handleAssignmentClick(btn) {
  const id = btn.dataset.assignment;
  const assignment = (appState.bootstrap.assignments || []).find(function (a) {
    return String(a.id) === String(id);
  });
  if (!assignment) return;

  appState.currentAssignment = id;
  populateAnswerModal(assignment);
  showAnswerModal();
}

function showAnswerModal() {
  els.answerModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (!els.answerText.disabled) els.answerText.focus();
}

function hideAnswerModal() {
  els.answerModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

async function handleSubmitAnswer() {
  if (appState.submittedAnswers.has(String(appState.currentAssignment))) {
    hideAnswerModal();
    return;
  }

  const answer = els.answerText.value.trim();
  if (!answer) {
    alert('Пожалуйста, введите промпт');
    return;
  }

  els.submitAnswerButton.disabled = true;
  els.submitAnswerButton.textContent = 'Отправка…';

  try {
    const result = await postAction({
      action: 'submit-answer',
      teamName: appState.teamName,
      assignmentNumber: Number(appState.currentAssignment),
      answer: answer,
    });

    if (!result.success) {
      alert('Ошибка отправки ответа');
      return;
    }

    const assignmentId = String(appState.currentAssignment);
    const hasVisibleScore = result.score != null;

    appState.submittedAnswers.add(assignmentId);
    appState.teamSubmissions[assignmentId] = {
      answer: answer,
      score: hasVisibleScore ? result.score : null,
      feedback: result.feedback || null,
    };

    if (hasVisibleScore) {
      els.answerText.disabled = true;
      els.answerWarning.classList.add('hidden');
      els.submitAnswerButton.textContent = 'Закрыть';
      showAnswerResult(result.score, result.feedback);
      els.answerResultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      hideAnswerModal();
    }

    if (appState.bootstrap) {
      renderAssignments(appState.bootstrap);
    }
    loadData();
  } catch (err) {
    alert('Ошибка отправки ответа. Попробуйте позже.');
  } finally {
    els.submitAnswerButton.disabled = false;
    if (!appState.submittedAnswers.has(String(appState.currentAssignment))) {
      els.submitAnswerButton.textContent = 'Отправить';
    }
  }
}

function showLinksModal() {
  if (!appState.bootstrap) return;
  buildLinksModalContent(els.linksModalContent, appState.bootstrap.config);
  els.linksModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideLinksModal() {
  els.linksModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

function showNotification(message) {
  const el = document.createElement('div');
  el.className =
    'fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 bg-green-500 text-white transition-all duration-300';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(function () {
    el.style.opacity = '0';
    setTimeout(function () {
      document.body.removeChild(el);
    }, 300);
  }, 3000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const FEEDBACK_SECTION_LABELS = ['Сильные стороны', 'Зоны роста'];

function formatFeedbackHtml(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';

  const pattern = new RegExp('(' + FEEDBACK_SECTION_LABELS.join('|') + '):\\s*', 'g');
  const parts = raw.split(pattern);

  if (parts.length === 1) {
    return '<p class="leading-relaxed">' + escapeHtml(raw) + '</p>';
  }

  let html = '';
  for (let i = 1; i < parts.length; i += 2) {
    const label = parts[i];
    const content = String(parts[i + 1] || '').trim();
    if (!content) continue;

    html +=
      '<div>' +
      '<div class="font-semibold text-gray-800 mb-1">' +
      escapeHtml(label) +
      '</div>' +
      '<div class="leading-relaxed">' +
      escapeHtml(content) +
      '</div>' +
      '</div>';
  }

  return html || '<p class="leading-relaxed">' + escapeHtml(raw) + '</p>';
}
