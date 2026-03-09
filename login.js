const DEMO_USER = 'admin';
const DEMO_PASS = 'admin123';
const AUTH_KEY = 'issue-tracker-auth';

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

bootLoginPage();

function bootLoginPage() {
  if (isUserLoggedIn()) {
    window.location.replace('dashboard.html');
    return;
  }

  loginForm.addEventListener('submit', handleLogin);
}

function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (username !== DEMO_USER || password !== DEMO_PASS) {
    loginError.textContent = 'Wrong username or password. Please use admin / admin123.';
    return;
  }

  const authData = {
    username,
    loginTime: Date.now(),
    isLoggedIn: true
  };

  localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
  loginError.textContent = '';
  loginForm.reset();
  window.location.href = 'dashboard.html';
}

function isUserLoggedIn() {
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
