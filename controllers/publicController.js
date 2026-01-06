/**
 * Public Controller
 */

const { marked } = require('marked');
const path = require('path');
const asyncHandler = require('express-async-handler');
const itemService = require('../services/itemService');
const categoryService = require('../services/categoryService');

// Config: Default grid size for pagination (can be overridden by ENV)
const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE) || 9;

/**
 * Data Helper
 *
 * It Attaches:
 * 1. Category: The full category object matched by ID.
 * 2. Thumbnail: Convenience property pointing to the first image.
 */
const enrichItems = async (items) => {
  const categories = await categoryService.getAllCategories();
  return items.map((item) => {
    const category = item.categoryId
      ? categories.find((c) => c.id === item.categoryId)
      : null;

    return {
      ...item,
      thumbnail:
        item.images && item.images.length > 0 ? item.images[0] : null,
      category: category,
    };
  });
};

/**
 * Determine Page Number
 */
const getPageNumber = (req) => {
  return parseInt(req.params.page) || parseInt(req.query.page) || 1;
};

/**
 * Renders the Homepage.
 */
const showHome = asyncHandler(async (req, res) => {
  if (req.query.search) {
    const cleanQuery = req.query.search.trim();
    // If empty, just go home
    if (!cleanQuery) return res.redirect('/');
    return res.redirect(`/search/${encodeURIComponent(cleanQuery)}`);
  }

  const page = getPageNumber(req);

  const result = await itemService.getPublicItems({
    page,
    limit: ITEMS_PER_PAGE,
    search: '',
  });

  result.data = await enrichItems(result.data);
  const categories = await categoryService.getAllCategories();

  res.render('public/index', {
    items: result.data,
    pagination: result.meta,
    categories,
    searchQuery: '',
    pageTitle: 'All Templates',
    paginationBase: '',
  });
});

/**
 * Renders Search Results
 */
const showSearch = asyncHandler(async (req, res) => {
  const page = getPageNumber(req);
  const query = req.params.query;

  const result = await itemService.getPublicItems({
    page,
    limit: ITEMS_PER_PAGE,
    search: query,
  });

  result.data = await enrichItems(result.data);
  const categories = await categoryService.getAllCategories();

  res.render('public/index', {
    items: result.data,
    pagination: result.meta,
    categories,
    searchQuery: query, // Keeps input filled
    pageTitle: `Search: "${query}"`,
    paginationBase: `/search/${encodeURIComponent(query)}`,
  });
});

/**
 * Renders the Category Archive page.
 */
const showCategoryArchive = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const page = getPageNumber(req);

  const categories = await categoryService.getAllCategories();
  const category = categories.find((c) => c.slug === slug);

  // Handle invalid category URLs
  if (!category) {
    return res.status(404).render('public/404', {
      title: 'Category Not Found',
      message: 'Category does not exist.',
    });
  }

  const result = await itemService.getPublicItems({
    page,
    limit: ITEMS_PER_PAGE,
    categoryId: category.id,
  });

  result.data = await enrichItems(result.data);

  res.render('public/category', {
    category,
    items: result.data,
    pagination: result.meta,
    categories,
    paginationBase: `/category/${slug}`,
  });
});

/**
 * Renders the Tag Archive page.
 */
const showTagArchive = asyncHandler(async (req, res) => {
  const { tag } = req.params;
  const page = getPageNumber(req);

  const result = await itemService.getPublicItems({
    page,
    limit: ITEMS_PER_PAGE,
    tag: tag,
  });

  result.data = await enrichItems(result.data);
  const categories = await categoryService.getAllCategories();

  res.render('public/tag', {
    tag,
    items: result.data,
    pagination: result.meta,
    categories,
    paginationBase: `/tag/${tag}`,
  });
});

/**
 * Renders a single Item Detail page.
 */
const showItem = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const item = await itemService.getItemBySlug(slug);

  if (!item) {
    return res.status(404).render('public/404', {
      title: '404 - Item Not Found',
      message: `Item '${slug}' not found.`,
    });
  }

  // Ensure images array exists even if empty
  item.images = item.images || [];

  const categories = await categoryService.getAllCategories();
  const currentCategory = item.categoryId
    ? categories.find((c) => c.id === item.categoryId)
    : null;

  res.render('public/item', {
    item,
    categories,
    currentCategory,
    markdown: marked.parse,
  });
});

/**
 * Serves the Live Preview HTML file.
 */
const showPreview = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const item = await itemService.getItemBySlug(slug);

  // Check:
  // 1. Item must exist.
  // 2. Must have a file path.
  // 3. Must be an HTML file.
  if (!item || !item.filePath || !item.filePath.endsWith('.html')) {
    // Fallback: Redirect to the item detail page
    return res.redirect(`/item/${slug}`);
  }

  // Resolve absolute path to the file
  const fullPath = path.join(__dirname, '..', 'public', item.filePath);

  // Serve the raw file to the browser
  res.sendFile(fullPath);
});

/**
 * Handles File Downloads.
 *
 * This route acts as a proxy. The user requests /item/slug/download,
 * and the server streams the file from /uploads/files/UUID.zip.
 * This hides the internal UUID filename and storage path from the end user.
 */
const downloadItem = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const item = await itemService.getItemBySlug(slug);

  if (!item || !item.filePath) return res.sendStatus(404);

  const fullPath = path.join(__dirname, '..', 'public', item.filePath);

  // Provide the file to the browser with a friendly filename
  res.download(fullPath, `${item.slug}${path.extname(item.filePath)}`);
});

module.exports = {
  showHome,
  showSearch,
  showItem,
  showPreview,
  downloadItem,
  showCategoryArchive,
  showTagArchive,
};
