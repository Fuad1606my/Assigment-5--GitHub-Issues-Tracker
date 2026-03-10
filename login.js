const DEMO_USER = 'admin';
const DEMO_PASS = 'admin123';
const AUTH_KEY = 'issue-tracker-auth';

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const passwordInput = document.getElementById('password');
const togglePasswordButton = document.getElementById('togglePassword');
const showPasswordCheck = document.getElementById('showPasswordCheck');

startLoginPage();

function startLoginPage() {
  if (isLoggedIn()) {
    window.location.replace('dashboard.html');
    return;
  }

  loginForm.addEventListener('submit', onLoginSubmit);
  togglePasswordButton.addEventListener('click', onTogglePassword);
  showPasswordCheck.addEventListener('change', onShowPasswordChange);
}

function onLoginSubmit(event) {
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
    isLoggedIn: true,
    loginTime: Date.now()
  };

  localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
  loginError.textContent = '';
  loginForm.reset();
  window.location.href = 'dashboard.html';
}

function isLoggedIn() {
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

function onTogglePassword() {
  setPasswordVisibility(passwordInput.type === 'password');
}

function onShowPasswordChange(event) {
  setPasswordVisibility(event.target.checked);
}

function setPasswordVisibility(showPassword) {
  passwordInput.type = showPassword ? 'text' : 'password';
  togglePasswordButton.textContent = showPassword ? 'Hide' : 'Show';
  togglePasswordButton.setAttribute('aria-label', showPassword ? 'Hide password' : 'Show password');
  showPasswordCheck.checked = showPassword;
}
