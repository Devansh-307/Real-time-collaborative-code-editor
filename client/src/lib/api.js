/**
 * CodeSync API Client
 * Centralized HTTP request library for rooms, templates, and sandboxed code execution.
 */

function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api`;
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
}

const API_BASE = getApiBaseUrl();

/**
 * Perform a JSON API request with error handling and response normalization
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.detail || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error.message);
    throw error;
  }
}

/**
 * Fetch supported programming languages
 */
export async function getLanguages() {
  return request('/languages');
}

/**
 * Fetch starter template for a language
 */
export async function getTemplate(language) {
  return request(`/templates/${encodeURIComponent(language)}`);
}

/**
 * Create a new collaborative room
 */
export async function createRoom(language = 'python', customRoomId = null) {
  return request('/rooms/create', {
    method: 'POST',
    body: JSON.stringify({
      language,
      custom_room_id: customRoomId,
    }),
  });
}

/**
 * Validate room existence and format
 */
export async function joinRoom(roomId, username = '') {
  return request('/rooms/join', {
    method: 'POST',
    body: JSON.stringify({
      room_id: roomId,
      username,
    }),
  });
}

/**
 * Execute code inside isolated Docker sandbox
 */
export async function executeCode({
  language,
  files,
  entryFile,
  stdin = '',
  timeoutSeconds = 5,
}) {
  return request('/execute', {
    method: 'POST',
    body: JSON.stringify({
      language,
      files,
      entry_file: entryFile,
      stdin,
      timeout_seconds: timeoutSeconds,
    }),
  });
}
