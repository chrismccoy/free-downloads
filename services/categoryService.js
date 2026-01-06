/**
 * Category Service
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');

/**
 * Retrieves all categories from the database.
 */
const getAllCategories = async () => {
  return await db('categories').select('*');
};

/**
 * Retrieves a single category by its unique identifier.
 */
const getCategoryById = async (id) => {
  return await db('categories').where({ id }).first();
};

/**
 * Retrieves a single category by its URL-friendly slug.
 */
const getCategoryBySlug = async (slug) => {
  return await db('categories').where({ slug }).first();
};

/**
 * Creates a new category.
 */
const createCategory = async (name, icon) => {
  const newCategory = {
    id: uuidv4(),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    icon: icon || 'fa-solid fa-folder',
  };

  await db('categories').insert(newCategory);

  return newCategory;
};

/**
 * Updates an existing category.
 */
const updateCategory = async (id, name, icon) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  await db('categories')
    .where({ id })
    .update({ name, slug, icon });

  return getCategoryById(id);
};

/**
 * Deletes a category by its ID.
 */
const deleteCategory = async (id) => {
  await db('categories').where({ id }).del();
};

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
