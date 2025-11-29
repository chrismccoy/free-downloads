/**
 * Authentication Service
 */

require('dotenv').config();

/**
 * Checks if a user is currently authenticated based on their session state.
 */
const isAuthenticated = (session) => !!session.isLoggedIn;

/**
 * Prepares the initial data context for the Login View.
 */
const getLoginPageData = () => ({ error: null });

/**
 * Authenticates a user against credentials stored in Environment Variables.
 * If successful, modifies the session object to mark the user as logged in.
 */
const authenticateUser = async (username, password, session) => {
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
        session.isLoggedIn = true;
        return { success: true, redirect: '/admin/dashboard' };
    }
    return { success: false, error: 'Access Denied' };
};

/**
 * Logs the user out by destroying their server-side session.
 */
const logoutUser = async (session) => {
    return new Promise((resolve) => {
        session.destroy(() => resolve({ redirect: '/admin/login' }));
    });
};

module.exports = { 
    isAuthenticated, 
    getLoginPageData, 
    authenticateUser, 
    logoutUser 
};
