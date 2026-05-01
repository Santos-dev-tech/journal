/* ============================================================
   TRADE JOURNAL — Auth Module
   Email + Password authentication with per-user data isolation
   ============================================================ */

const AUTH_USERS_KEY  = 'tj_users_v1';
const AUTH_SESSION_KEY = 'tj_session_v1';

// ── Crypto helpers ──────────────────────────────────────────
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'tj_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── User store ──────────────────────────────────────────────
function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || {}; }
  catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

// ── Session ─────────────────────────────────────────────────
function setSession(email, displayName) {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ email, displayName }));
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY)); }
  catch { return null; }
}

function clearSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

// ── Register ─────────────────────────────────────────────────
async function register(email, displayName, password) {
  const users = getUsers();
  const key = email.toLowerCase().trim();
  if (!key || !password || !displayName) throw new Error('All fields are required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) throw new Error('Enter a valid email address.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');
  if (users[key]) throw new Error('An account with this email already exists.');
  const hash = await hashPassword(password);
  users[key] = { email: key, displayName: displayName.trim(), hash, createdAt: Date.now() };
  saveUsers(users);
  setSession(key, displayName.trim());
}

// ── Login ────────────────────────────────────────────────────
async function login(email, password) {
  const users = getUsers();
  const key = email.toLowerCase().trim();
  if (!key || !password) throw new Error('Email and password are required.');
  const user = users[key];
  if (!user) throw new Error('No account found with this email.');
  const hash = await hashPassword(password);
  if (hash !== user.hash) throw new Error('Incorrect password.');
  setSession(key, user.displayName);
}

// ── Storage key for a user ───────────────────────────────────
function userStorageKey(email) {
  return `trade_journal_v2_${email.toLowerCase()}`;
}

// ── Expose globally ──────────────────────────────────────────
window.TJAuth = { register, login, getSession, clearSession, userStorageKey };
