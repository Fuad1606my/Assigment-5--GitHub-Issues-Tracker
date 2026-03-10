const BASE_URL = 'https://phi-lab-server.vercel.app/api/v1/lab';
const AUTH_KEY = 'issue-tracker-auth';

const state = {
  allIssues: [],
  visibleIssues: [],
  activeFilter: 'all',
  activeSearch: ''
};

const refs = {
  tabButtons: [...document.querySelectorAll('.tab-btn')],
  issuesGrid: document.getElementById('issuesGrid'),
  issueCount: document.getElementById('issueCount'),
  loadingState: document.getElementById('loadingState'),
  emptyState: document.getElementById('emptyState'),
  searchForm: document.getElementById('searchForm'),
  searchInput: document.getElementById('searchInput'),
  modal: document.getElementById('issueModal'),
  modalContent: document.getElementById('modalContent'),
  modalCloseX: document.getElementById('modalCloseX'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  newIssueBtn: document.getElementById('newIssueBtn')
};

startApp();

function startApp() {
  if (!userHasAccess()) {
    window.location.replace('index.html');
    return;
  }

  document.body.classList.remove('locked-body');
  addEventListeners();
  loadIssues();
}

function userHasAccess() {
  const savedAuth = localStorage.getItem(AUTH_KEY);

  if (!savedAuth) {
    return false;
  }

  try {
    const parsedAuth = JSON.parse(savedAuth);
    return Boolean(parsedAuth && parsedAuth.isLoggedIn);
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return false;
  }
}

function addEventListeners() {
  refs.searchForm.addEventListener('submit', handleSearch);

  refs.tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextFilter = button.dataset.filter;

      if (nextFilter === state.activeFilter) {
        return;
      }

      state.activeFilter = nextFilter;
      state.activeSearch = '';
      refs.searchInput.value = '';

      updateActiveTab(nextFilter);
      loadIssues();
    });
  });

  refs.issuesGrid.addEventListener('click', async (event) => {
    const card = event.target.closest('[data-issue-id]');
    if (!card) {
      return;
    }

    const issueId = card.dataset.issueId;
    await openIssueModal(issueId);
  });

  refs.logoutBtn.addEventListener('click', handleLogout);
  refs.newIssueBtn.addEventListener('click', showNewIssueMessage);
  refs.modalCloseBtn.addEventListener('click', closeModal);
  refs.modalCloseX.addEventListener('click', closeModal);

  refs.modal.addEventListener('click', (event) => {
    if (event.target.dataset.close === 'true') {
      closeModal();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !refs.modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

function handleLogout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.replace('index.html');
}

function handleSearch(event) {
  event.preventDefault();
  state.activeSearch = refs.searchInput.value.trim();
  loadIssues();
}

function updateActiveTab(filter) {
  refs.tabButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function showLoading(show) {
  refs.loadingState.classList.toggle('hidden', !show);

  if (show) {
    refs.issuesGrid.innerHTML = '';
    refs.emptyState.classList.add('hidden');
  }
}

async function loadIssues() {
  showLoading(true);

  try {
    const issues = state.activeSearch
      ? await searchIssues(state.activeSearch)
      : await getAllIssues();

    state.allIssues = issues;
    state.visibleIssues = filterIssues(issues, state.activeFilter);
    renderIssues(state.visibleIssues);
  } catch {
    refs.issuesGrid.innerHTML = '';
    refs.emptyState.classList.remove('hidden');
    refs.emptyState.innerHTML = `
      <h4>Something went wrong</h4>
      <p>Could not load issues right now. Please try again.</p>
    `;
  } finally {
    showLoading(false);
  }
}

async function getAllIssues() {
  const response = await fetch(`${BASE_URL}/issues`);

  if (!response.ok) {
    throw new Error('Failed to fetch issues');
  }

  const result = await response.json();
  return result.data || [];
}

async function searchIssues(query) {
  const response = await fetch(`${BASE_URL}/issues/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error('Failed to search issues');
  }

  const result = await response.json();
  return result.data || [];
}

function filterIssues(issues, filter) {
  if (filter === 'all') {
    return [...issues];
  }

  return issues.filter((issue) => normalizeStatus(issue.status) === filter);
}

function renderIssues(issues) {
  refs.issueCount.textContent = issues.length;
  refs.emptyState.classList.add('hidden');

  if (!issues.length) {
    refs.issuesGrid.innerHTML = '';
    refs.emptyState.classList.remove('hidden');
    refs.emptyState.innerHTML = `
      <h4>No issues found</h4>
      <p>No issues match your current tab or search term.</p>
    `;
    return;
  }

  refs.issuesGrid.innerHTML = issues.map(buildIssueCard).join('');
}

function buildIssueCard(issue) {
  const labels = issue.labels?.length
    ? issue.labels.map((label) => buildLabelChip(label)).join('')
    : '<span class="label-chip default">No label</span>';

  return `
    <article
      class="issue-card ${normalizeStatus(issue.status)}"
      data-issue-id="${issue.id}"
      tabindex="0"
      aria-label="Open issue ${escapeHtml(issue.title)}"
    >
      <button type="button">
        <div class="issue-body">
          <div class="card-top">
            ${buildStatusIcon(issue.status)}
            <span class="priority-chip ${getPriorityClass(issue.priority)}">${escapeHtml(issue.priority || 'Low')}</span>
          </div>

          <h4 class="issue-title">${escapeHtml(issue.title || '')}</h4>
          <p class="issue-desc">${escapeHtml(shortenText(issue.description || '', 90))}</p>

          <div class="label-row">${labels}</div>
        </div>

        <div class="issue-meta">
          <p>#${issue.id} by <strong>${escapeHtml(issue.author || 'Unknown')}</strong></p>
          <p>Assignee: <strong>${escapeHtml(issue.assignee || 'Unassigned')}</strong></p>
          <p>${formatDate(issue.createdAt)}</p>
        </div>
      </button>
    </article>
  `;
}

async function openIssueModal(issueId) {
  refs.modal.classList.remove('hidden');
  refs.modal.setAttribute('aria-hidden', 'false');
  refs.modalContent.innerHTML = `
    <div class="state-box">
      <div class="spinner"></div>
      <p>Loading issue details...</p>
    </div>
  `;

  try {
    const response = await fetch(`${BASE_URL}/issue/${issueId}`);

    if (!response.ok) {
      throw new Error('Failed to load issue');
    }

    const result = await response.json();
    const issue = result.data;

    refs.modalContent.innerHTML = `
      <h2 id="modalTitle" class="modal-title">${escapeHtml(issue.title || '')}</h2>

      <div class="modal-meta-line">
        ${buildModalStatusIcon(issue.status)}
        <span>Opened by ${escapeHtml(issue.author || 'Unknown')}</span>
        <span>&bull;</span>
        <span>${formatDate(issue.createdAt)}</span>
      </div>

      <div class="modal-labels">
        ${(issue.labels || []).map((label) => buildLabelChip(label)).join('')}
      </div>

      <p class="modal-desc">${escapeHtml(issue.description || '')}</p>

      <div class="modal-info-grid">
        <div class="info-item">
          <p>Assignee:</p>
          <h4>${escapeHtml(issue.assignee || 'Unassigned')}</h4>
        </div>
        <div class="info-item">
          <p>Priority:</p>
          <h4>${capitalize(issue.priority || 'low')}</h4>
        </div>
      </div>
    `;
  } catch {
    refs.modalContent.innerHTML = `
      <div class="state-box">
        <h4>Issue could not be loaded</h4>
        <p>Please try again.</p>
      </div>
    `;
  }
}

function closeModal() {
  refs.modal.classList.add('hidden');
  refs.modal.setAttribute('aria-hidden', 'true');
}

function showNewIssueMessage() {
  refs.modal.classList.remove('hidden');
  refs.modal.setAttribute('aria-hidden', 'false');
  refs.modalContent.innerHTML = `
    <h2 id="modalTitle" class="modal-title">New issue form</h2>
    <p class="modal-desc">
      This button is added to match the design. If create issue functionality is needed later,
      this area can be used for the form.
    </p>
    <div class="modal-info-grid">
      <div class="info-item full-width">
        <p>Status</p>
        <h4>UI Ready</h4>
      </div>
    </div>
  `;
}

function normalizeStatus(status) {
  return String(status || '').toLowerCase() === 'closed' ? 'closed' : 'open';
}

function getStatusImage(status) {
  return normalizeStatus(status) === 'closed'
    ? 'assets/Closed- Status .png'
    : 'assets/Open-Status.png';
}

function buildStatusIcon(status) {
  const normalizedStatus = normalizeStatus(status);
  const altText = normalizedStatus === 'closed' ? 'Closed status' : 'Open status';

  return `
    <span class="status-chip-image">
      <img src="${getStatusImage(normalizedStatus)}" alt="${altText}" class="status-chip-icon" />
    </span>
  `;
}

function buildModalStatusIcon(status) {
  const normalizedStatus = normalizeStatus(status);
  const altText = normalizedStatus === 'closed' ? 'Closed status' : 'Open status';

  return `
    <span class="modal-status-chip-image">
      <img src="${getStatusImage(normalizedStatus)}" alt="${altText}" class="modal-status-icon" />
    </span>
  `;
}

function buildLabelChip(label) {
  const labelText = String(label || '').trim();
  const labelClass = getLabelClass(labelText);
  const iconSvg = getLabelIcon(labelClass);

  return `
    <span class="label-chip ${labelClass}">
      ${iconSvg}
      <span>${escapeHtml(labelText)}</span>
    </span>
  `;
}

function getLabelClass(label) {
  const value = String(label || '').toLowerCase().replace(/\s+/g, '-');
  const validClasses = ['bug', 'help-wanted', 'enhancement', 'documentation', 'good-first-issue'];
  return validClasses.includes(value) ? value : 'default';
}

function getLabelIcon(labelClass) {
  const iconClass = 'label-chip-icon';

  switch (labelClass) {
    case 'bug':
      return `
        <svg class="${iconClass}" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="8" r="4.2"></circle>
          <path d="M8 1.8v2M4 3.2l1.2 1.3M12 3.2l-1.2 1.3M1.8 6h2M12.2 6h2M3.4 11l1.4-1M12.6 11l-1.4-1"></path>
        </svg>
      `;
    case 'help-wanted':
      return `
        <svg class="${iconClass}" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="8" r="5"></circle>
          <path d="M6.7 6.2a1.5 1.5 0 1 1 2.3 1.3c-.8.5-1.1.9-1.1 1.7"></path>
          <circle cx="8" cy="11.8" r=".7" fill="currentColor" stroke="none"></circle>
        </svg>
      `;
    case 'enhancement':
      return `
        <svg class="${iconClass}" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 1.8l1.2 3 3 .8-2.2 2.1.5 3.2L8 9.5 5.5 10.9 6 7.7 3.8 5.6l3-.8L8 1.8z"></path>
        </svg>
      `;
    case 'documentation':
      return `
        <svg class="${iconClass}" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 2.5h4l2 2V13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5a1 1 0 0 1 1-1z"></path>
          <path d="M9 2.5V5h2.5"></path>
        </svg>
      `;
    case 'good-first-issue':
      return `
        <svg class="${iconClass}" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 2.2l1.7 3.4 3.8.6-2.8 2.7.7 3.8L8 10.9l-3.4 1.8.7-3.8L2.5 6.2l3.8-.6L8 2.2z"></path>
        </svg>
      `;
    default:
      return '';
  }
}

function getPriorityClass(priority) {
  const value = String(priority || '').toLowerCase();
  return ['high', 'medium', 'low'].includes(value) ? value : 'low';
}

function shortenText(text, limit) {
  const cleanText = String(text || '');
  return cleanText.length > limit ? `${cleanText.slice(0, limit).trim()}...` : cleanText;
}

function formatDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString('en-GB');
}

function capitalize(value) {
  const text = String(value || '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
