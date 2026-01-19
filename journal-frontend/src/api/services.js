import apiClient from './client';

export const authService = {
    // Login (uses Basic Auth)
    login: async (username, password) => {
        try {
            // Store credentials for Basic Auth
            const auth = { username, password };
            localStorage.setItem('auth', JSON.stringify(auth));

            // Try multiple endpoints to get user roles
            let rolesFound = false;

            // Method 1: Try /user endpoint
            try {
                const userResponse = await apiClient.get('/user');
                console.log('✅ User data from /user:', userResponse.data);
                if (userResponse.data && userResponse.data.roles) {
                    localStorage.setItem('userRoles', JSON.stringify(userResponse.data.roles));
                    console.log('✅ Stored roles from /user:', userResponse.data.roles);
                    rolesFound = true;
                }
            } catch (err) {
                console.warn('⚠️ /user endpoint failed:', err.message);
            }

            // Method 2: If no roles found, try admin endpoint (will fail for non-admins but that's ok)
            if (!rolesFound) {
                try {
                    await apiClient.get('/admin/all-user');
                    // If this succeeds, user is definitely an admin
                    console.log('✅ User can access admin endpoint - granting ADMIN role');
                    localStorage.setItem('userRoles', JSON.stringify(['USER', 'ADMIN']));
                    rolesFound = true;
                } catch (err) {
                    console.log('ℹ️ User cannot access admin endpoint (expected for non-admins)');
                }
            }

            // Method 3: Default to USER role if nothing else worked
            if (!rolesFound) {
                console.log('ℹ️ No roles found, defaulting to USER role');
                localStorage.setItem('userRoles', JSON.stringify(['USER']));
            }

            return { success: true };
        } catch (error) {
            localStorage.removeItem('auth');
            localStorage.removeItem('userRoles');
            throw error;
        }
    },

    // Register new user
    register: async (userData) => {
        const response = await apiClient.post('/public/create-user', userData);
        return response.data;
    },

    // Logout
    logout: () => {
        localStorage.removeItem('auth');
        localStorage.removeItem('userRoles');
        window.location.href = '/login';
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('auth');
    },

    // Get current user info
    getCurrentUser: () => {
        const auth = localStorage.getItem('auth');
        if (auth) {
            const { username } = JSON.parse(auth);
            const rolesStr = localStorage.getItem('userRoles');
            const roles = rolesStr ? JSON.parse(rolesStr) : [];
            return { username, roles };
        }
        return null;
    },

    // Check if user has admin role
    isAdmin: () => {
        const rolesStr = localStorage.getItem('userRoles');
        if (rolesStr) {
            const roles = JSON.parse(rolesStr);
            return roles.includes('ADMIN');
        }
        return false;
    },
};

export const userService = {
    // Update user
    updateUser: async (userData) => {
        const response = await apiClient.put('/user', userData);
        return response.data;
    },

    // Delete user
    deleteUser: async () => {
        const response = await apiClient.delete('/user');
        return response.data;
    },

    // Update preferences
    updatePreferences: async (preferences) => {
        const response = await apiClient.put('/user/preferences', preferences);
        return response.data;
    },
};

export const journalService = {
    // Get all journal entries
    getAllEntries: async () => {
        const response = await apiClient.get('/journal');
        return response.data;
    },

    // Get single entry by ID
    getEntryById: async (id) => {
        const response = await apiClient.get(`/journal/id/${id}`);
        return response.data;
    },

    // Create new entry
    createEntry: async (entry) => {
        const response = await apiClient.post('/journal', entry);
        return response.data;
    },

    // Update entry
    updateEntry: async (id, entry) => {
        const response = await apiClient.put(`/journal/id/${id}`, entry);
        return response.data;
    },

    // Delete entry
    deleteEntry: async (id) => {
        const response = await apiClient.delete(`/journal/id/${id}`);
        return response.data;
    },

    // Reanalyze entry
    reanalyzeEntry: async (id) => {
        const response = await apiClient.post(`/journal/reanalyze/${id}`);
        return response.data;
    },
};

export const dashboardService = {
    // Get weekly summary
    getWeeklySummary: async () => {
        const response = await apiClient.get('/api/dashboard/weekly-summary');
        return response.data;
    },

    // Get progress
    getProgress: async () => {
        const response = await apiClient.get('/api/dashboard/progress');
        return response.data;
    },

    // Generate weekly summary (test endpoint)
    generateWeeklySummary: async () => {
        const response = await apiClient.post('/api/test/weekly-summary');
        return response.data;
    },
};

export const adminService = {
    // Get all users
    getAllUsers: async () => {
        const response = await apiClient.get('/admin/all-user');
        return response.data;
    },

    // Create admin user
    createAdminUser: async (userData) => {
        const response = await apiClient.post('/admin/create-admin-user', userData);
        return response.data;
    },
};
