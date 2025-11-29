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

// Creates a new item stub to allow immediate editing
router.post('/items/add', protect, admin.handleAddItem);

// Deletes an item and cascades to details/files
router.post('/items/delete/:id', protect, admin.handleDeleteItem);

// Renders the complex Item Editor (Upsert Form)
router.get('/item/:id/manage', protect, admin.showItemEditor);

// Handles the multipart form submission (Images, Files, Text) for an item
router.post('/item/:id/upsert', protect, admin.handleUpsertDetail);

// Specifically deletes the "Detail" record (images/files) while keeping the Item shell
router.post('/details/delete/:id', protect, admin.handleDeleteDetail);

// Lists all categories
router.get('/categories', protect, admin.showCategories);

// Creates a new category
router.post('/categories/add', protect, admin.handleAddCategory);

// Renders the specific category edit form
router.get('/categories/edit/:id', protect, admin.showEditCategory);

// Updates category metadata (name, icon)
router.post('/categories/edit/:id', protect, admin.handleUpdateCategory);

// Deletes a category
router.post('/categories/delete/:id', protect, admin.handleDeleteCategory);

module.exports = router;
