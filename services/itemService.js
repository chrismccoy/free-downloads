/**
 * Item Service
 */

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { readDb, writeDb } = require('../utils/db');
const { deleteImage, deleteProductFile } = require('../utils/fileUtils');

/**
 * Pagination Utility
 */
const paginate = (items, page = 1, limit = 9) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: items.slice(startIndex, endIndex),
    meta: {
      currentPage: parseInt(page),
      totalPages: totalPages,
      totalItems: totalItems,
      hasNext: endIndex < totalItems,
      hasPrev: startIndex > 0,
    },
  };
};

/**
 * Retrieves all items from the database.
 */
const getAllItems = async () => {
  const db = await readDb();

  return db.items.map((i) => {
    return {
      ...i,
      tags: i.tags || [],
    };
  });
};

/**
 * Retrieves a specific item by its UUID.
 */
const getItemById = async (id) => {
  const db = await readDb();
  const item = db.items.find((i) => i.id === id);

  if (item && !item.tags) {
    item.tags = [];
  }

  return item;
};

/**
 * Retrieves a specific item by its URL-friendly slug.
 */
const getItemBySlug = async (slug) => {
  const db = await readDb();
  const item = db.items.find((i) => i.slug === slug);

  if (item && !item.tags) {
    item.tags = [];
  }

  return item;
};

/**
 * Creates a new item skeleton.
 */
const createItem = async (name) => {
  const db = await readDb();

  const newItem = {
    id: uuidv4(),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    categoryId: null,
    tags: [],
    title: name, // Default title to name
    content: '',
    images: [],
    filePath: null,
    externalLink: null,
  };

  db.items.push(newItem);
  await writeDb(db);

  return newItem;
};


/**
 * Updates item metadata
 *
 * Handles metadata updates
 */
const updateItem = async (id, formData, files) => {
  const db = await readDb();
  const index = db.items.findIndex((i) => i.id === id);

  if (index === -1) {
    return null;
  }

  const oldItem = db.items[index];

  // 1. Process Metadata
  const {
    name,
    categoryId,
    tags: tagsString,
    title,
    content,
    existingImages,
    externalLink,
  } = formData;

  // Parse Tags
  let tags = [];

  if (typeof tagsString === 'string') {
    tags = tagsString
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
      .filter((t) => t.length > 0);
  } else if (Array.isArray(tagsString)) {
    tags = tagsString
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
      .filter((t) => t.length > 0);
  }

  // Process Images
  // Determine which old images are kept vs deleted
  let imagesToKeep = [];

  if (existingImages) {
    if (Array.isArray(existingImages)) {
      imagesToKeep = existingImages;
    } else {
      imagesToKeep = [existingImages];
    }
  }

  // Delete images that were in oldItem but not in imagesToKeep
  if (oldItem.images && oldItem.images.length > 0) {
    const keptSet = new Set(imagesToKeep);

    await Promise.all(
      oldItem.images.map(async (img) => {
        if (!keptSet.has(img)) {
          await deleteImage(img);
        }
      })
    );
  }

  // Add new uploaded images
  let newImagePaths = [];

  if (files && files.newImages) {
    newImagePaths = files.newImages.map(
      (f) => `/uploads/images/${f.filename}`
    );
  }

  const finalImages = [...new Set([...imagesToKeep, ...newImagePaths])];

  // Process Product File
  let finalFilePath = oldItem.filePath;

  // If a new file is uploaded, delete the old one and set the new path
  if (files && files.productFile && files.productFile[0]) {
    if (oldItem.filePath) {
      await deleteProductFile(oldItem.filePath);
    }
    finalFilePath = `/uploads/files/${files.productFile[0].filename}`;
  }

  // Update Database Object
  db.items[index] = {
    ...oldItem,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    categoryId: categoryId || null,
    tags,
    title: title || name,
    content: content || '',
    images: finalImages,
    filePath: finalFilePath,
    externalLink: externalLink ? externalLink.trim() : null,
  };

  await writeDb(db);
  return db.items[index];
};

/**
 * Deletes an item and all its associated physical files.
 */
const deleteItem = async (id) => {
  const db = await readDb();
  const item = db.items.find((i) => i.id === id);

  if (item) {
    // Cleanup Images
    if (item.images && item.images.length > 0) {
      await Promise.all(item.images.map(deleteImage));
    }

    // Cleanup Product File
    if (item.filePath) {
      await deleteProductFile(item.filePath);
    }

    // Remove from DB
    db.items = db.items.filter((i) => i.id !== id);
    await writeDb(db);
  }
};

/**
 * Public filter API.
 * Handles search, tag filtering, and category filtering.
 */
const getPublicItems = async (options = {}) => {
  const { page, limit, search, tag, categoryId } = options;
  const db = await readDb();

  // Normalize tags on load
  let items = db.items.map((i) => {
    return {
      ...i,
      tags: i.tags || [],
    };
  });

  if (search) {
    const q = search.toLowerCase();
    items = items.filter((i) => {
      const nameMatch = i.name.toLowerCase().includes(q);
      const tagMatch = i.tags && i.tags.some((t) => t.includes(q));
      return nameMatch || tagMatch;
    });
  }

  if (categoryId) {
    items = items.filter((i) => i.categoryId === categoryId);
  }

  if (tag) {
    items = items.filter((i) => i.tags && i.tags.includes(tag));
  }

  return paginate(items, page, limit);
};

module.exports = {
  getAllItems,
  getItemById,
  getItemBySlug,
  createItem,
  updateItem,
  deleteItem,
  getPublicItems,
};
