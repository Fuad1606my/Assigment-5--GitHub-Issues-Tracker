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

function init() {
  if (!hasAccess()) {
    window.location.replace('index.html');
    return;
  }

  document.body.classList.remove('locked-body');
  bindEvents();
  loadIssues();
}

function bindEvents() {
  refs.searchForm.addEventListener('submit', handleSearch);

  refs.tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextFilter = button.dataset.filter;
      if (nextFilter === state.activeFilter) return;
      state.activeFilter = nextFilter;
      state.activeSearch = '';
      refs.searchInput.value = '';
      setActiveTab(nextFilter);
      loadIssues();
    });
  });

  refs.issuesGrid.addEventListener('click', async (event) => {
    const card = event.target.closest('[data-issue-id]');
    if (!card) return;
    const issueId = card.dataset.issueId;
    await openIssueModal(issueId);
  });

  refs.logoutBtn.addEventListener('click', handleLogout);
  refs.newIssueBtn.addEventListener('click', openNewIssueMessage);
  refs.modalCloseBtn.addEventListener('click', closeModal);
  refs.modalCloseX.addEventListener('click', closeModal);
  refs.modal.addEventListener('click', (event) => {
    if (event.target.dataset.close === 'true') closeModal();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !refs.modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

function hasAccess() {
  const rawValue = localStorage.getItem(AUTH_KEY);
  if (!rawValue) return false;

  try {
    const savedValue = JSON.parse(rawValue);
    return Boolean(savedValue && savedValue.isLoggedIn);
  } catch (error) {
    localStorage.removeItem(AUTH_KEY);
    return false;
  }
}

function handleLogout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.replace('index.html');
}

function openNewIssueMessage() {
  refs.modal.classList.remove('hidden');
  refs.modal.setAttribute('aria-hidden', 'false');
  refs.modalContent.innerHTML = `
    <h2 id="modalTitle" class="modal-title">New issue form</h2>
    <p class="modal-desc">This button is added to match the design. If your teacher asks for create issue functionality later, this spot is ready for a form.</p>
    <div class="modal-info-grid">
      <div class="info-item full-width">
        <p>Status</p>
        <h4>UI Ready</h4>
      </div>
    </div>
  `;
}

async function loadIssues() {
  showLoading(true);

  try {
    let issues = [];

    if (state.activeSearch.trim()) {
      issues = await searchIssues(state.activeSearch.trim());
    } else {
      issues = await getAllIssues();
    }

    state.allIssues = issues;
    state.visibleIssues = filterIssues(issues, state.activeFilter);
    renderIssues(state.visibleIssues);
  } catch (error) {
    refs.issuesGrid.innerHTML = '';
    refs.emptyState.classList.remove('hidden');
    refs.emptyState.innerHTML = '<h4>Something went wrong</h4><p>Could not load issues right now. Please try again.</p>';
  } finally {
    showLoading(false);
  }
}

async function getAllIssues() {
  const response = await fetch(`${BASE_URL}/issues`);
  if (!response.ok) throw new Error('Failed to fetch issues');
  const result = await response.json();
  return result.data || [];
}

async function searchIssues(query) {
  const response = await fetch(`${BASE_URL}/issues/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search issues');
  const result = await response.json();
  return result.data || [];
}

function filterIssues(issues, filter) {
  if (filter === 'all') return [...issues];
  return issues.filter((issue) => issue.status === filter);
}

function renderIssues(issues) {
  refs.issueCount.textContent = issues.length;
  refs.emptyState.classList.add('hidden');

  if (!issues.length) {
    refs.issuesGrid.innerHTML = '';
    refs.emptyState.classList.remove('hidden');
    refs.emptyState.innerHTML = '<h4>No issues found</h4><p>No issues match your current tab or search term.</p>';
    return;
  }

  refs.issuesGrid.innerHTML = issues.map(createIssueCard).join('');
}

function createIssueCard(issue) {
  const labels = issue.labels?.length
    ? issue.labels.map((label) => `<span class="label-chip ${labelToClass(label)}">${escapeHtml(label)}</span>`).join('')
    : '<span class="label-chip default">No label</span>';

  return `
    <article class="issue-card ${issue.status}" data-issue-id="${issue.id}" tabindex="0" aria-label="Open issue ${escapeHtml(issue.title)}">
      <button type="button">
        <div class="issue-body">
          <div class="card-top">
            <span class="status-chip ${issue.status}">${escapeHtml(issue.status)}</span>
            <span class="priority-chip ${priorityClass(issue.priority)}">${escapeHtml(issue.priority)}</span>
          </div>

          <h4 class="issue-title">${escapeHtml(issue.title)}</h4>
          <p class="issue-desc">${escapeHtml(trimText(issue.description, 92))}</p>

          <div class="label-row">${labels}</div>
        </div>

        <div class="issue-meta">
          <p>#${issue.id} by <strong>${escapeHtml(issue.author)}</strong></p>
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
  refs.modalContent.innerHTML = '<div class="state-box"><div class="spinner"></div><p>Loading issue details...</p></div>';

  try {
    const response = await fetch(`${BASE_URL}/issue/${issueId}`);
    if (!response.ok) throw new Error('Failed to load issue');
    const result = await response.json();
    const issue = result.data;

    refs.modalContent.innerHTML = `
      <h2 id="modalTitle" class="modal-title">${escapeHtml(issue.title)}</h2>

      <div class="modal-meta-line">
        <span class="modal-status-chip ${issue.status}">${capitalize(issue.status)}</span>
        <span>Opened by ${escapeHtml(issue.author)}</span>
        <span>&bull;</span>
        <span>${formatDate(issue.createdAt)}</span>
      </div>

      <div class="modal-labels">
        ${(issue.labels || []).map((label) => `<span class="label-chip ${labelToClass(label)}">${escapeHtml(label)}</span>`).join('')}
      </div>

      <p class="modal-desc">${escapeHtml(issue.description)}</p>

      <div class="modal-info-grid">
        <div class="info-item">
          <p>Assignee:</p>
          <h4>${escapeHtml(issue.assignee || 'Unassigned')}</h4>
        </div>
        <div class="info-item">
          <p>Priority:</p>
          <h4>${capitalize(issue.priority)}</h4>
        </div>
      </div>
    `;
  } catch (error) {
    refs.modalContent.innerHTML = '<div class="state-box"><h4>Issue could not be loaded</h4><p>Please try again.</p></div>';
  }
}

function closeModal() {
  refs.modal.classList.add('hidden');
  refs.modal.setAttribute('aria-hidden', 'true');
}

function handleSearch(event) {
  event.preventDefault();
  state.activeSearch = refs.searchInput.value.trim();
  loadIssues();
}

function setActiveTab(filter) {
  refs.tabButtons.forEach((button) => {
    const isCurrent = button.dataset.filter === filter;
    button.classList.toggle('active', isCurrent);
    button.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  });
}

function showLoading(isLoading) {
  refs.loadingState.classList.toggle('hidden', !isLoading);
  if (isLoading) {
    refs.issuesGrid.innerHTML = '';
    refs.emptyState.classList.add('hidden');
  }
}

function priorityClass(priority) {
  return String(priority || '').toLowerCase();
}

function labelToClass(label) {
  const value = String(label || '').toLowerCase().replace(/\s+/g, '-');
  const known = ['bug', 'help-wanted', 'enhancement', 'good-first-issue', 'documentation'];
  return known.includes(value) ? value : 'default';
}

function trimText(text, limit) {
  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
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

init();
