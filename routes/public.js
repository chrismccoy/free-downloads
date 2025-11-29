/**
 * Public Routes Configuration
 */

const express = require('express');
const router = express.Router();
const pub = require('../controllers/publicController');

/**
 * Homepage Route
 */
router.get('/', pub.showHome);

/**
 * Category Archive Route
 */
router.get('/category/:slug', pub.showCategoryArchive);

/**
 * Tag Archive Route
 */
router.get('/tag/:tag', pub.showTagArchive); 

/**
 * Single Item Detail Route
 */
router.get('/item/:slug', pub.showItem);

/**
 * File Download Route
 */
router.get('/item/:slug/download', pub.downloadItem);

module.exports = router;
