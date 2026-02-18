// api.js - Handles all communication with backend API

// ============================================
// CONFIGURATION
// ============================================

// Production API URL (Render deployment)
// const API_BASE_URL = 'https://journal-z8qo.onrender.com';

// For local development, uncomment the line below:
const API_BASE_URL = 'https://journal-backend-v14j.onrender.com';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get authentication credentials from localStorage
 * Returns the Base64 encoded credentials or null if not logged in
 */
function getAuthCredentials() {
    // localStorage.getItem() retrieves saved data from browser storage
    // We saved credentials when user logged in
    return localStorage.getItem('authCredentials');
}

/**
 * Get username from localStorage
 * Returns the username or null if not logged in
 */
function getUsername() {
    return localStorage.getItem('username');
}

/**
 * Save authentication credentials to localStorage
 * @param {string} username - User's username
 * @param {string} password - User's password
 */
function saveAuthCredentials(username, password) {
    // btoa() converts "username:password" to Base64 format
    // This is required for HTTP Basic Authentication
    // Example: "john:pass123" becomes "am9objpwYXNzMTIz"
    const credentials = btoa(`${username}:${password}`);

    // Save to browser's localStorage so user stays logged in
    localStorage.setItem('authCredentials', credentials);
    localStorage.setItem('username', username);
}

/**
 * Clear authentication credentials (logout)
 */
function clearAuthCredentials() {
    // Remove saved credentials from browser
    localStorage.removeItem('authCredentials');
    localStorage.removeItem('username');
}

/**
 * Check if user is logged in
 * @returns {boolean} true if logged in, false otherwise
 */
function isLoggedIn() {
    // If credentials exist in localStorage, user is logged in
    return getAuthCredentials() !== null;
}

// ============================================
// API CALL FUNCTIONS
// ============================================

/**
 * Login user - validates credentials with backend
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<Object>} Promise that resolves with user data or rejects with error
 */
async function login(username, password) {
    // Create Base64 credentials for this login attempt
    const credentials = btoa(`${username}:${password}`);

    try {
        // fetch() makes HTTP request to backend
        // We call GET /journal to verify credentials work
        const response = await fetch(`${API_BASE_URL}/journal`, {
            method: 'GET', // HTTP GET method
            headers: {
                // Authorization header in format: "Basic base64credentials"
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        // Check if request was successful (status 200-299)
        if (!response.ok) {
            // If 401, credentials are wrong
            if (response.status === 401) {
                throw new Error('Invalid username or password');
            }
            // Other errors
            throw new Error(`Login failed: ${response.status}`);
        }

        // If successful, save credentials for future requests
        saveAuthCredentials(username, password);

        // Return success with username
        return { success: true, username };

    } catch (error) {
        // If error occurs (network error, wrong credentials, etc.)
        console.error('Login error:', error);
        throw error; // Re-throw so calling code can handle it
    }
}

/**
 * Logout user - clears credentials
 */
function logout() {
    clearAuthCredentials();
    // Redirect to login page
    window.location.href = 'index.html';
}

/**
 * Get all journal entries for logged-in user
 * @returns {Promise<Array>} Promise that resolves with array of journal entries
 */
async function getAllEntries() {
    // Get saved credentials
    const credentials = getAuthCredentials();

    // If not logged in, redirect to login
    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Make GET request to fetch all entries
        const response = await fetch(`${API_BASE_URL}/journal`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        // If unauthorized (token expired), logout
        if (response.status === 401) {
            logout();
            return;
        }

        // If request failed
        if (!response.ok) {
            throw new Error(`Failed to fetch entries: ${response.status}`);
        }

        // response.json() converts JSON string to JavaScript object/array
        const entries = await response.json();
        return entries;

    } catch (error) {
        console.error('Error fetching entries:', error);
        throw error;
    }
}

/**
 * Get single journal entry by ID
 * @param {string} entryId - MongoDB ObjectId of the entry
 * @returns {Promise<Object>} Promise that resolves with journal entry
 */
async function getEntryById(entryId) {
    const credentials = getAuthCredentials();

    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/journal/id/${entryId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch entry: ${response.status}`);
        }

        const entry = await response.json();
        return entry;

    } catch (error) {
        console.error('Error fetching entry:', error);
        throw error;
    }
}

/**
 * Create new journal entry
 * @param {string} title - Entry title
 * @param {string} content - Entry content
 * @returns {Promise<Object>} Promise that resolves with created entry (including AI analysis)
 */
async function createEntry(title, content) {
    const credentials = getAuthCredentials();

    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Create entry object to send
        const entryData = {
            title: title,
            content: content
        };

        // Make POST request to create entry
        const response = await fetch(`${API_BASE_URL}/journal`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            // JSON.stringify() converts JavaScript object to JSON string
            body: JSON.stringify(entryData)
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to create entry: ${response.status}`);
        }

        // Backend returns created entry with AI analysis
        const createdEntry = await response.json();
        return createdEntry;

    } catch (error) {
        console.error('Error creating entry:', error);
        throw error;
    }
}

/**
 * Delete journal entry by ID
 * @param {string} entryId - MongoDB ObjectId of the entry
 * @returns {Promise<void>}
 */
async function deleteEntry(entryId) {
    const credentials = getAuthCredentials();

    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Note: Your backend endpoint is /journal/id/{id} with DELETE method
        const response = await fetch(`${API_BASE_URL}/journal/id/${entryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        // Check for 204 No Content (success) or 200 OK
        if (response.status === 204 || response.status === 200) {
            return { success: true };
        }

        if (!response.ok) {
            throw new Error(`Failed to delete entry: ${response.status}`);
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting entry:', error);
        throw error;
    }
}

/**
 * Re-analyze journal entry (refresh AI analysis)
 * @param {string} entryId - MongoDB ObjectId of the entry
 * @returns {Promise<Object>} Promise that resolves with updated entry
 */
async function reanalyzeEntry(entryId) {
    const credentials = getAuthCredentials();

    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/journal/reanalyze/${entryId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to reanalyze entry: ${response.status}`);
        }

        const updatedEntry = await response.json();
        return updatedEntry;

    } catch (error) {
        console.error('Error reanalyzing entry:', error);
        throw error;
    }
}

/**
 * Get user progress statistics
 * @returns {Promise<Object>} Promise that resolves with progress data
 */
async function getProgress() {
    const credentials = getAuthCredentials();

    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/progress`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch progress: ${response.status}`);
        }

        const progress = await response.json();
        return progress;

    } catch (error) {
        console.error('Error fetching progress:', error);
        throw error;
    }
}

/**
 * Get weekly summary
 * @returns {Promise<Object>} Promise that resolves with weekly summary data
 */
async function getWeeklySummary() {
    const credentials = getAuthCredentials();

    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/weekly-summary`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        // 204 No Content means no summary available yet
        if (response.status === 204) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch weekly summary: ${response.status}`);
        }

        const summary = await response.json();
        return summary;

    } catch (error) {
        console.error('Error fetching weekly summary:', error);
        throw error;
    }
}

/**
 * Generate/update weekly summary
 * @returns {Promise<Object>} Promise that resolves when summary is generated
 */
async function generateWeeklySummary() {
    const credentials = getAuthCredentials();

    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/test/weekly-summary`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to generate weekly summary: ${response.status}`);
        }

        const result = await response.text();
        return { success: true, message: result };

    } catch (error) {
        console.error('Error generating weekly summary:', error);
        throw error;
    }
}

/**
 * Update user preferences
 * @param {string} email - User email
 * @param {boolean} weeklySummaryEnabled - Enable weekly summary
 * @param {number} weeklySummaryDay - Day of week (0=Sunday, 1=Monday, etc.)
 * @param {boolean} emailNotificationsEnabled - Enable email notifications
 * @returns {Promise<void>}
 */
async function updatePreferences(email, weeklySummaryEnabled, weeklySummaryDay, emailNotificationsEnabled) {
    const credentials = getAuthCredentials();

    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const preferencesData = {
            email: email,
            weeklySummaryEnabled: weeklySummaryEnabled,
            weeklySummaryDay: weeklySummaryDay,
            emailNotificationsEnabled: emailNotificationsEnabled
        };

        const response = await fetch(`${API_BASE_URL}/user/preferences`, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferencesData)
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to update preferences: ${response.status}`);
        }

        return { success: true };

    } catch (error) {
        console.error('Error updating preferences:', error);
        throw error;
    }
}

/**
 * Update journal entry
 * @param {string} entryId - Entry ID
 * @param {string} title - Updated title
 * @param {string} content - Updated content
 * @returns {Promise<Object>} Promise that resolves with updated entry
 */
async function updateEntry(entryId, title, content) {
    const credentials = getAuthCredentials();

    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const entryData = {
            title: title,
            content: content
        };

        const response = await fetch(`${API_BASE_URL}/journal/id/${entryId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entryData)
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to update entry: ${response.status}`);
        }

        const updatedEntry = await response.json();
        return updatedEntry;

    } catch (error) {
        console.error('Error updating entry:', error);
        throw error;
    }
}

/**
 * Update user profile (username/password)
 * @param {string} username - New username
 * @param {string} password - New password
 * @returns {Promise<void>}
 */
async function updateUser(username, password) {
    const credentials = getAuthCredentials();

    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const userData = {
            userName: username,
            password: password
        };

        const response = await fetch(`${API_BASE_URL}/user`, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to update user: ${response.status}`);
        }

        // Update stored credentials with new username/password
        saveAuthCredentials(username, password);

        return { success: true };

    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

/**
 * Delete user account
 * @returns {Promise<void>}
 */
async function deleteUser() {
    const credentials = getAuthCredentials();

    if (!credentials) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/user`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to delete user: ${response.status}`);
        }

        // Clear credentials and redirect to signup
        clearAuthCredentials();
        return { success: true };

    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}


// ============================================
// EXPORT FUNCTIONS (Make them available to other files)
// ============================================

// These functions can now be used in other JavaScript files
// Just include this file with <script src="js/api.js"></script>

/*
Usage example in other files:

// Login
login('john', 'password123')
    .then(data => {
        console.log('Logged in!', data);
    })
    .catch(error => {
        console.error('Login failed:', error);
    });

// Get all entries
getAllEntries()
    .then(entries => {
        console.log('My entries:', entries);
    });

// Create entry
createEntry('My Day', 'Today was great!')
    .then(entry => {
        console.log('Entry created:', entry);
    });
*/