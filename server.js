/**
 * Free Downloads Application
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const { initializeDatabase } = require('./utils/dbInitializer');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Environment Flag
 */
app.locals.isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Static File Serving
 * 1. Root static files (CSS, client-side JS) from /public.
 * 2. Uploaded content explicitly mounted at /uploads. 
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use(express.urlencoded({ extended: true }));

/**
 * Session Management
 */
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,             // Do not save session if unmodified
    saveUninitialized: true,   // Save new sessions that haven't been modified yet
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mount Public Routes
app.use('/', publicRoutes);

// Mount Admin routes
app.use('/admin', adminRoutes);

/**
 * 404 Fallback Handler
 */
app.use((req, res) => res.status(404).render('public/404'));

/**
 * Woot
 */
(async () => {
    try {
        // Ensure FS structure (db/ uploads/) exists
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log('\n-----------------------------------------------------');
            console.log(`🚀  Public Site: http://localhost:${PORT}`);
            console.log(`🔐  Admin Panel: http://localhost:${PORT}/admin/login`);
            console.log(`🌍  Environment: ${process.env.NODE_ENV || 'production'}`);
            console.log('-----------------------------------------------------\n');
        });
    } catch (error) {
        // If we can't create the DB file or bind the port, the app cannot run.
        console.error('SYSTEM FAILURE:', error);
        process.exit(1);
    }
})();
