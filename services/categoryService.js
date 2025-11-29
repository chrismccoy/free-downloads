/**
 * Category Service
 */

const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');

/**
 * Retrieves all categories from the database.
 */
const getAllCategories = async () => {
    const db = await readDb();
    if (!db.categories) db.categories = [];
    return db.categories;
};

/**
 * Retrieves a single category by its unique identifier.
 */
const getCategoryById = async (id) => {
    const categories = await getAllCategories();
    return categories.find(c => c.id === id);
};

/**
 * Retrieves a single category by its URL-friendly slug.
 */
const getCategoryBySlug = async (slug) => {
    const categories = await getAllCategories();
    return categories.find(c => c.slug === slug);
};

/**
 * Creates a new category.
 */
const createCategory = async (name, icon) => {
    const db = await readDb();
    if (!db.categories) db.categories = [];
    
    const newCategory = {
        id: uuidv4(),
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: icon || 'fa-solid fa-folder' 
    };
    
    db.categories.push(newCategory);
    await writeDb(db);
    return newCategory;
};

/**
 * Updates an existing category.
 */
const updateCategory = async (id, name, icon) => {
    const db = await readDb();
    const index = db.categories.findIndex(c => c.id === id);
    
    if (index > -1) {
        db.categories[index].name = name;
        db.categories[index].slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        db.categories[index].icon = icon;
        
        await writeDb(db);
        return db.categories[index];
    }
    return null;
};

/**
 * Deletes a category by its ID.
 */
const deleteCategory = async (id) => {
    const db = await readDb();
    
    // Filter out the category with the matching ID
    db.categories = db.categories.filter(c => c.id !== id);
    await writeDb(db);
};

module.exports = {
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory
};
