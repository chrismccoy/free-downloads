/**
 * Public Routes Configuration
 */

const express = require('express');
const router = express.Router();
const pub = require('../controllers/publicController');

/**
 * Homepage Route and Pagination
 */
router.get('/', pub.showHome);
router.get('/page/:page', pub.showHome);

/**
 * Search Routes and Pagination
 */
router.get('/search/:query', pub.showSearch);
router.get('/search/:query/page/:page', pub.showSearch);

/**
 * Category Archive and Pagination
 */
router.get('/category/:slug', pub.showCategoryArchive);
router.get('/category/:slug/page/:page', pub.showCategoryArchive);

/**
 * Tag Archive and Pagination
 */
router.get('/tag/:tag', pub.showTagArchive);
router.get('/tag/:tag/page/:page', pub.showTagArchive);

/**
 * Single Item Detail Route
 */
router.get('/item/:slug', pub.showItem);

/**
 * File Download Route
 */
router.get('/item/:slug/download', pub.downloadItem);

/**
 * Live Preview Route
 */
router.get('/item/:slug/preview', pub.showPreview);

module.exports = router;
