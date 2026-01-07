/**
 * Admin Controller
 */

const { marked } = require('marked');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const itemService = require('../services/itemService');
const categoryService = require('../services/categoryService');
const authService = require('../services/authService');
const { cleanupUploadedFiles } = require('../utils/fileUtils');

/**
 * Multer Configuration
 *
 * Configures the multipart/form-data handler for file uploads.
 */
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'newImages') {
        cb(null, path.join(__dirname, '..', 'public', 'uploads', 'images'));
      } else if (file.fieldname === 'productFile') {
        cb(null, path.join(__dirname, '..', 'public', 'uploads', 'files'));
      } else {
        cb(new Error('Invalid upload field'), false);
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  // Security: Cap uploads at 100MB to prevent DoS via disk filling
  limits: { fileSize: 100 * 1024 * 1024 },
}).fields([
  // Allow multiple screenshots (max 10) but only one product zip file
  { name: 'newImages', maxCount: 10 },
  { name: 'productFile', maxCount: 1 },
]);

/**
 * Renders the Login View.
 */
const showLogin = asyncHandler(async (req, res) =>
  res.render('admin/login', authService.getLoginPageData())
);

/**
 * Processes the Login Form.
 * Authenticates credentials and sets the session state.
 */
const handleLogin = asyncHandler(async (req, res) => {
  const result = await authService.authenticateUser(
    req.body.username,
    req.body.password,
    req.session
  );
  result.success
    ? res.redirect(result.redirect)
    : res.render('admin/login', { error: result.error });
});

/**
 * Log Out Handler.
 * Destroys the session and redirects to login.
 */
const handleLogout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.session);
  res.redirect('/admin/login');
});

/**
 * Renders the Main Dashboard.
 */
const showDashboard = asyncHandler(async (req, res) => {
  const items = await itemService.getAllItems();
  const categories = await categoryService.getAllCategories();
  res.render('admin/dashboard', { items, categories });
});

/**
 * Instead of a "Create" screen, we create a blank entity in the DB
 * immediately and redirect the user to the "Edit" screen for that new ID.
 * This simplifies by making the Editor always operate in "Update" mode
 * regarding the Item ID.
 */
const handleAddItem = asyncHandler(async (req, res) => {
  if (req.body.name) {
    const newItem = await itemService.createItem(req.body.name);
    return res.redirect(`/admin/item/${newItem.id}/manage`);
  }
  res.redirect('/admin/dashboard');
});

/**
 * Deletes an Item.
 * Triggers a cascading delete of the Item and its physical files.
 */
const handleDeleteItem = asyncHandler(async (req, res) => {
  await itemService.deleteItem(req.params.id);
  res.redirect('/admin/dashboard');
});

/**
 * Renders the Item Editor.
 * Fetches all relation data needed for dropdowns and previews.
 */
const showItemEditor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await itemService.getItemById(id);

  // Guard clause: If invalid ID, bounce to dashboard
  if (!item) return res.redirect('/admin/dashboard');

  const categories = await categoryService.getAllCategories();

  res.render('admin/item-editor', {
    item,
    categories,
    error: null,
  });
});

/**
 * Handles the Upsert (Update) for an Item.
 */
const handleUpsertItem = asyncHandler(async (req, res, next) => {
  upload(req, res, async (err) => {
    const { id: itemId } = req.params;

    if (err) {
      await cleanupUploadedFiles(req.files);

      const item = await itemService.getItemById(itemId);
      const categories = await categoryService.getAllCategories();

      return res.render('admin/item-editor', {
        item,
        categories,
        error: err.message,
      });
    }

    try {
      await itemService.updateItem(itemId, req.body, req.files);
      res.redirect(`/admin/item/${itemId}/manage`);
    } catch (error) {
      await cleanupUploadedFiles(req.files);
      next(error);
    }
  });
});

/**
 * Renders Category List.
 */
const showCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  res.render('admin/categories', { categories });
});

/**
 * Adds a new Category.
 */
const handleAddCategory = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  if (name) await categoryService.createCategory(name, icon);
  res.redirect('/admin/categories');
});

/**
 * Renders Category Edit Form.
 */
const showEditCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  if (!category) return res.redirect('/admin/categories');
  res.render('admin/edit-category', { category });
});

/**
 * Updates Category Metadata.
 */
const handleUpdateCategory = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  await categoryService.updateCategory(req.params.id, name, icon);
  res.redirect('/admin/categories');
});

/**
 * Deletes a Category.
 */
const handleDeleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.redirect('/admin/categories');
});

/**
 * Generates a screenshot for an HTML item.
 * Responds with JSON for AJAX
 */
const handleGenerateScreenshot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Call the screenshot service
    await itemService.generateScreenshot(id);

    // Respond with JSON so the browser knows it worked without reloading it yet
    res.json({ success: true, message: 'Screenshot generated successfully' });
  } catch (error) {
    // If it fails, send a 500 error and the message
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = {
  showLogin,
  handleLogin,
  handleLogout,
  showDashboard,
  handleAddItem,
  handleDeleteItem,
  showItemEditor,
  handleUpsertItem,
  handleGenerateScreenshot,
  showCategories,
  handleAddCategory,
  showEditCategory,
  handleUpdateCategory,
  handleDeleteCategory,
};
