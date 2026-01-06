/**
 * Item Service
 *
 * Handles metadata, content, and physical file operations.
 */

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const db = require('../utils/db');
const { deleteImage, deleteProductFile } = require('../utils/fileUtils');

/**
 * Normalizes DB output
 */
const normalizeItem = (item) => {
  if (!item) return null;
  return {
    ...item,
    tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags,
    images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images,
  };
};

/**
 * Retrieves all items from the database.
 */
const getAllItems = async () => {
  const items = await db('items').select('*');
  return items.map(normalizeItem);
};

/**
 * Retrieves a specific item by its UUID.
 */
const getItemById = async (id) => {
  const item = await db('items').where({ id }).first();
  return normalizeItem(item);
};

/**
 * Retrieves a specific item by its URL-friendly slug.
 */
const getItemBySlug = async (slug) => {
  const item = await db('items').where({ slug }).first();
  return normalizeItem(item);
};

/**
 * Creates a new item skeleton.
 */
const createItem = async (name) => {
  const newItem = {
    id: uuidv4(),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    categoryId: null,
    tags: JSON.stringify([]),
    title: name,
    content: '',
    images: JSON.stringify([]),
    filePath: null,
    externalLink: null,
  };

  await db('items').insert(newItem);
  return normalizeItem(newItem);
};

/**
 * Updates an item.
 *
 * Handles metadata updates, file uploads, image merging,
 * and cleanup of removed assets.
 */
const updateItem = async (id, formData, files) => {
  const oldItemRaw = await db('items').where({ id }).first();
  if (!oldItemRaw) return null;

  const oldItem = normalizeItem(oldItemRaw);

  // Process Metadata
  const {
    name,
    categoryId,
    tags: tagsString,
    title,
    content,
    existingImages,
    externalLink,
  } = formData;

  // Parse Tags from Input
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
  // Determine which old images are kept
  let imagesToKeep = [];
  if (existingImages) {
    imagesToKeep = Array.isArray(existingImages) ? existingImages : [existingImages];
  }

  // Delete images physically that were removed from the list
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
    newImagePaths = files.newImages.map((f) => `/uploads/images/${f.filename}`);
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

  // Prepare SQL Update
  const updateData = {
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    categoryId: categoryId || null,
    tags: JSON.stringify(tags),
    title: title || name,
    content: content || '',
    images: JSON.stringify(finalImages),
    filePath: finalFilePath,
    externalLink: externalLink ? externalLink.trim() : null,
  };

  await db('items').where({ id }).update(updateData);

  return getItemById(id);
};

/**
 * Deletes an item and all its associated physical files.
 */
const deleteItem = async (id) => {
  const itemRaw = await db('items').where({ id }).first();
  if (!itemRaw) return;

  const item = normalizeItem(itemRaw);

  // Cleanup Images
  if (item.images && item.images.length > 0) {
    await Promise.all(item.images.map(deleteImage));
  }

  // Cleanup Product File
  if (item.filePath) {
    await deleteProductFile(item.filePath);
  }

  // Remove from DB
  await db('items').where({ id }).del();
};

/**
 * Public filter API with Pagination.
 * Handles search, tag filtering, and category filtering.
 */
const getPublicItems = async (options = {}) => {
  const { page, limit, search, tag, categoryId } = options;

  const query = db('items');

  // Search
  if (search) {
    const q = search.toLowerCase();
    query.where((builder) => {
      builder.where('name', 'like', `%${q}%`)
             .orWhere('tags', 'like', `%${q}%`);
    });
  }

  // Category Filter
  if (categoryId) {
    query.where({ categoryId });
  }

  // Tag Filter
  if (tag) {
    query.where('tags', 'like', `%"${tag}"%`);
  }

  // Clone query to get total count for pagination
  const countResult = await query.clone().count('id as total').first();
  const totalItems = countResult.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Apply Pagination limits
  const offset = (page - 1) * limit;
  const itemsRaw = await query.limit(limit).offset(offset);

  // Normalize JSON fields
  const data = itemsRaw.map(normalizeItem);

  return {
    data,
    meta: {
      currentPage: parseInt(page),
      totalPages: totalPages,
      totalItems: totalItems,
      hasNext: offset + limit < totalItems,
      hasPrev: offset > 0,
    },
  };
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
