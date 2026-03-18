const API_BASE_URL = 'https://justia.dipietroassociates.com/api';

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const registerUser = async (name, email, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
};

export const migrateThreads = async (sessionId) => {
  const res = await fetch(`${API_BASE_URL}/auth/migrate-threads`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ sessionId }),
  });
  return res.json();
};

export const fetchThreads = async (sessionId) => {
  const token = localStorage.getItem('auth_token');
  const url = token
    ? `${API_BASE_URL}/threads`
    : `${API_BASE_URL}/threads?sessionId=${sessionId}`;

  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  return res.json();
};

export const fetchThreadMessages = async (threadId, sessionId) => {
  const url = `${API_BASE_URL}/threads/${threadId}/messages?sessionId=${sessionId}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  return res.json();
};

export const deleteThread = async (threadId) => {
  const res = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return res.ok;
};
