/**
 * Item Service
 */

const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');

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
            hasPrev: startIndex > 0
        }
    };
};

/**
 * Retrieves all items from the database.
 */
const getAllItems = async () => {
  const db = await readDb();
  return db.items.map(i => ({ ...i, tags: i.tags || [] }));
};

/**
 * Retrieves a specific item by its UUID.
 */
const getItemById = async (id) => {
  const db = await readDb();
  const item = db.items.find((i) => i.id === id);
  if(item && !item.tags) item.tags = [];
  return item;
};

/**
 * Retrieves a specific item by its URL-friendly slug.
 */
const getItemBySlug = async (slug) => {
    const db = await readDb();
    const item = db.items.find(i => i.slug === slug);
    if(item && !item.tags) item.tags = [];
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
    tags: []         
  };
  
  db.items.push(newItem);
  await writeDb(db);
  return newItem;
};

/**
 * Updates item metadata (Name, Category, Tags).
 */
const updateItem = async (id, name, categoryId, tagsString) => {
  const db = await readDb();
  const index = db.items.findIndex((i) => i.id === id);
  
  if (index > -1) {
    let tags = [];
    if (typeof tagsString === 'string') {
        tags = tagsString.split(',').map(t => t.trim().toLowerCase().replace(/\s+/g, '-')).filter(t => t.length > 0);
    } else if (Array.isArray(tagsString)) {
        tags = tagsString.map(t => t.trim().toLowerCase().replace(/\s+/g, '-')).filter(t => t.length > 0);
    }

    db.items[index].name = name;
    db.items[index].slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    db.items[index].categoryId = categoryId || null;
    db.items[index].tags = tags;
    
    await writeDb(db);
    return db.items[index];
  }
  return null;
};

/**
 * Deletes an item and its associated details.
 */
const deleteItem = async (id, detailService) => {
  await detailService.deleteDetailsByItemId(id);
  const db = await readDb();
  db.items = db.items.filter((i) => i.id !== id);
  await writeDb(db);
};

/**
 * Public filter API.
 * search, tag filtering, and category filtering.
 */
const getPublicItems = async (options = {}) => {
    const { page, limit, search, tag, categoryId } = options;
    const db = await readDb();
    
    let items = db.items.filter(i => db.details.some(d => d.itemId === i.id));
    items = items.map(i => ({ ...i, tags: i.tags || [] }));

    if (search) {
        const q = search.toLowerCase();
        items = items.filter(i => 
            i.name.toLowerCase().includes(q) || 
            (i.tags && i.tags.some(t => t.includes(q)))
        );
    }

    if (categoryId) {
        items = items.filter(i => i.categoryId === categoryId);
    }

    if (tag) {
        items = items.filter(i => i.tags && i.tags.includes(tag));
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
  getPublicItems
};
