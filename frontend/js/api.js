// ============================================================
// api.js — All backend communication for the Journal App
// ============================================================
// Auth model: JWT Bearer tokens
// Tokens are stored in sessionStorage (cleared when tab closes)
// NO passwords are ever stored. Only the JWT token is kept.
// ============================================================

// ============================================================
// CONFIGURATION
// ============================================================

const IS_LOCAL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

/**
 * Base URL for all API calls.
 * NOTE: The server context-path is /journal, so the full base is:
 *   - local:      http://localhost:8080/journal
 *   - production: https://journal-backend-v14j.onrender.com/journal
 */
const API_BASE_URL = IS_LOCAL
    ? 'http://localhost:8080/journal'
    : 'https://journal-backend-v14j.onrender.com/journal';

// ============================================================
// TOKEN MANAGEMENT (sessionStorage — never localStorage)
// ============================================================

/**
 * Get the stored JWT token.
 * Returns null if not logged in.
 */
function getToken() {
    return sessionStorage.getItem('jwtToken');
}

/**
 * Get the stored username.
 */
function getUsername() {
    return sessionStorage.getItem('username');
}

/**
 * Save auth state after successful login.
 * ONLY the token and username are stored — never the password.
 * @param {string} token - JWT token from the server
 * @param {string} username - Username of the logged-in user
 */
function saveAuthState(token, username) {
    sessionStorage.setItem('jwtToken', token);
    sessionStorage.setItem('username', username);
}

/**
 * Clear auth state (logout).
 */
function clearAuthState() {
    sessionStorage.removeItem('jwtToken');
    sessionStorage.removeItem('username');
}

/**
 * Check if user is logged in (has a token).
 * @returns {boolean}
 */
function isLoggedIn() {
    return getToken() !== null;
}

/**
 * Logout and redirect to login page.
 */
function logout() {
    clearAuthState();
    window.location.href = 'index.html';
}

// ============================================================
// CENTRALIZED FETCH WRAPPER
// ============================================================

/**
 * Central API call wrapper. All requests go through here.
 *
 * - Automatically attaches Authorization: Bearer <token> header
 * - Redirects to login on 401
 * - Returns parsed JSON for 2xx responses
 * - Returns null for 204 No Content
 * - Throws an Error with a message for non-2xx responses
 *
 * @param {string} path - API path (e.g. '/journal', '/public/login')
 * @param {object} options - fetch options (method, body, etc.)
 * @param {boolean} requiresAuth - if true, attaches Bearer token (default: true)
 * @returns {Promise<any>} parsed JSON response or null
 */
async function apiFetch(path, options = {}, requiresAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (requiresAuth) {
        const token = getToken();
        if (!token) {
            window.location.href = 'index.html';
            return;
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    // Handle 401/403 — token expired or invalid (Spring Security returns 403 by default)
    if (response.status === 401 || (response.status === 403 && !path.startsWith('/admin'))) {
        clearAuthState();
        window.location.href = 'index.html';
        return;
    }

    // 204 No Content — successful but no body
    if (response.status === 204) {
        return null;
    }

    // Parse JSON response
    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = (data && data.message) || (data && data.error) || `HTTP ${response.status}`;
        throw new Error(message);
    }

    return data;
}

// ============================================================
// AUTH FUNCTIONS
// ============================================================

/**
 * Login with username and password.
 * Sends credentials to backend, gets back a JWT.
 * Stores the JWT in sessionStorage.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{success: boolean, username: string}>}
 */
async function login(username, password) {
    try {
        // POST to /public/login — no auth token needed
        const data = await apiFetch('/public/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        }, false); // requiresAuth = false

        if (data && data.token) {
            saveAuthState(data.token, data.username);
            return { success: true, username: data.username };
        }

        throw new Error('Login failed: no token received');

    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// ============================================================
// JOURNAL ENTRY FUNCTIONS
// ============================================================

/**
 * Get all journal entries for the logged-in user (paginated).
 * @param {number} page - page number (0-indexed, default 0)
 * @param {number} size - entries per page (default 20)
 * @returns {Promise<Object>} Page object with content, totalElements, etc.
 */
async function getAllEntries(page = 0, size = 20) {
    try {
        const response = await apiFetch(`/journal?page=${page}&size=${size}`);
        // Handle Spring Data Page object or array
        return response.content !== undefined ? response.content : response;
    } catch (error) {
        console.error('Error fetching entries:', error);
        throw error;
    }
}

/**
 * Get a single journal entry by ID.
 * @param {string} entryId - MongoDB ObjectId string
 * @returns {Promise<Object>} Journal entry DTO
 */
async function getEntryById(entryId) {
    try {
        return await apiFetch(`/journal/id/${entryId}`);
    } catch (error) {
        console.error('Error fetching entry:', error);
        throw error;
    }
}

/**
 * Create a new journal entry.
 * AI analysis runs automatically on the backend.
 * @param {string} title
 * @param {string} content
 * @returns {Promise<Object>} Created entry DTO with AI analysis
 */
async function createEntry(title, content) {
    try {
        return await apiFetch('/journal', {
            method: 'POST',
            body: JSON.stringify({ title, content })
        });
    } catch (error) {
        console.error('Error creating entry:', error);
        throw error;
    }
}

/**
 * Update an existing journal entry.
 * If content changes, the backend re-runs AI analysis automatically.
 * @param {string} entryId
 * @param {string} title
 * @param {string} content
 * @returns {Promise<Object>} Updated entry DTO
 */
async function updateEntry(entryId, title, content) {
    try {
        return await apiFetch(`/journal/id/${entryId}`, {
            method: 'PUT',
            body: JSON.stringify({ title, content })
        });
    } catch (error) {
        console.error('Error updating entry:', error);
        throw error;
    }
}

/**
 * Delete a journal entry.
 * @param {string} entryId
 * @returns {Promise<null>}
 */
async function deleteEntry(entryId) {
    try {
        return await apiFetch(`/journal/id/${entryId}`, { method: 'DELETE' });
    } catch (error) {
        console.error('Error deleting entry:', error);
        throw error;
    }
}

/**
 * Re-run AI analysis on an existing entry.
 * @param {string} entryId
 * @returns {Promise<Object>} Updated entry DTO
 */
async function reanalyzeEntry(entryId) {
    try {
        return await apiFetch(`/journal/reanalyze/${entryId}`, { method: 'POST' });
    } catch (error) {
        console.error('Error reanalyzing entry:', error);
        throw error;
    }
}

// ============================================================
// DASHBOARD FUNCTIONS
// ============================================================

/**
 * Get user progress statistics (streak, entry counts).
 * @returns {Promise<Object>} UserProgressDTO
 */
async function getProgress() {
    try {
        return await apiFetch('/api/dashboard/progress');
    } catch (error) {
        console.error('Error fetching progress:', error);
        throw error;
    }
}

/**
 * Get the latest weekly summary for the dashboard.
 * Returns null if no summary has been generated yet (204 No Content).
 * @returns {Promise<Object|null>} WeeklySummaryDashboardDTO or null
 */
async function getWeeklySummary() {
    try {
        return await apiFetch('/api/dashboard/weekly-summary');
    } catch (error) {
        console.error('Error fetching weekly summary:', error);
        throw error;
    }
}

// ============================================================
// USER FUNCTIONS
// ============================================================

/**
 * Get the current user's profile info.
 * @returns {Promise<Object>} {username, email, preferences}
 */
async function getCurrentUser() {
    try {
        return await apiFetch('/user/me');
    } catch (error) {
        console.error('Error fetching user info:', error);
        throw error;
    }
}

/**
 * Update user preferences (weekly summary settings, email notifications).
 * @param {string|null} email
 * @param {boolean|null} weeklySummaryEnabled
 * @param {number|null} weeklySummaryDay  — ISO-8601: 1=Monday, 7=Sunday
 * @param {boolean|null} emailNotificationsEnabled
 * @returns {Promise<Object>}
 */
async function updatePreferences(email, weeklySummaryEnabled, weeklySummaryDay, emailNotificationsEnabled) {
    try {
        return await apiFetch('/user/preferences', {
            method: 'PUT',
            body: JSON.stringify({ email, weeklySummaryEnabled, weeklySummaryDay, emailNotificationsEnabled })
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        throw error;
    }
}

/**
 * Update username and/or password.
 * IMPORTANT: The user must log in again after this call — the old token
 * stays valid until expiry but the username may have changed.
 * @param {string} userName - new username
 * @param {string} password - new password (required)
 * @returns {Promise<Object>}
 */
async function updateUser(userName, password) {
    try {
        return await apiFetch('/user', {
            method: 'PUT',
            body: JSON.stringify({ userName, password })
        });
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

/**
 * Delete the current user's account and ALL associated data.
 * This action is irreversible.
 * @returns {Promise<Object>}
 */
async function deleteUser() {
    try {
        const result = await apiFetch('/user', { method: 'DELETE' });
        clearAuthState();
        return result;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// DASHBOARD FUNCTIONS
// ============================================================

/**
 * Get user progress (streaks, entry counts).
 * @returns {Promise<Object>} Progress DTO
 */
async function getProgress() {
    try {
        return await apiFetch('/api/dashboard/progress');
    } catch (error) {
        console.error('Error fetching progress:', error);
        throw error;
    }
}

/**
 * Get the latest weekly summary.
 * @returns {Promise<Object>} Weekly Summary DTO
 */
async function getWeeklySummary() {
    try {
        return await apiFetch('/api/dashboard/weekly-summary');
    } catch (error) {
        // If 204 No Content is returned, it will be null or empty string, which is fine
        console.error('Error fetching weekly summary:', error);
        throw error;
    }
}

/**
 * Trigger the generation of a new weekly summary manually.
 * @returns {Promise<Object>} Status message
 */
async function generateWeeklySummary() {
    try {
        return await apiFetch('/api/dashboard/weekly-summary', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error generating weekly summary:', error);
        throw error;
    }
}

/*
 * ============================================================
 * Usage examples:
 * ============================================================
 *
 * // Login (gets JWT, stores in sessionStorage)
 * login('john', 'mypassword')
 *   .then(data => console.log('Logged in:', data.username))
 *   .catch(err => console.error('Login failed:', err.message));
 *
 * // Create an entry
 * createEntry('My Day', 'Today was amazing!')
 *   .then(entry => console.log('Created:', entry.id, 'Mood:', entry.mood));
 *
 * // Update an entry
 * updateEntry('entryId123', 'Updated Title', 'New content here')
 *   .then(entry => console.log('Updated:', entry));
 *
 * // Delete an entry
 * deleteEntry('entryId123')
 *   .then(() => console.log('Deleted successfully'));
 */