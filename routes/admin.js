/**
 * Admin Routes Configuration
 */

const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { isAuthenticated } = require('../services/authService');

/**
 * Authentication Middleware
 */
const protect = (req, res, next) =>
    isAuthenticated(req.session) ? next() : res.redirect('/admin/login');

// Renders the login form
router.get('/login', admin.showLogin);

// Processes credentials
router.post('/login', admin.handleLogin);

// Destroys session
router.get('/logout', admin.handleLogout);

// Main Overview
router.get('/dashboard', protect, admin.showDashboard);

// Creates a new item stub
router.post('/items/add', protect, admin.handleAddItem);

// Deletes an item (cascades to files)
router.post('/items/delete/:id', protect, admin.handleDeleteItem);

// Renders the Item Editor
router.get('/item/:id/manage', protect, admin.showItemEditor);

// Handles the unified upsert (Metadata + Content + Files)
router.post('/item/:id/upsert', protect, admin.handleUpsertItem);

// Generates a screenshot for an HTML file
router.post('/items/generate-screenshot/:id', protect, admin.handleGenerateScreenshot);

// Lists all categories
router.get('/categories', protect, admin.showCategories);

// Creates a new category
router.post('/categories/add', protect, admin.handleAddCategory);

// Renders the specific category edit form
router.get('/categories/edit/:id', protect, admin.showEditCategory);

// Updates category metadata
router.post('/categories/edit/:id', protect, admin.handleUpdateCategory);

// Deletes a category
router.post('/categories/delete/:id', protect, admin.handleDeleteCategory);

module.exports = router;
