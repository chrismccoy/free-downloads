/**
 * Database Initializer
 *
 * Ensures the filesystem structure exists and runs Knex migrations
 * to create tables if they do not exist.
 */

const fs = require('fs/promises');
const path = require('path');
const db = require('./db');

/**
 * Executed once when the server starts.
 */
const initializeDatabase = async () => {
  const dbDirPath = path.join(__dirname, '..', 'db');
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
  const imagesDir = path.join(uploadsDir, 'images');
  const filesDir = path.join(uploadsDir, 'files');

  /**
   * Checks if a directory exists; if not, creates it.
   */
  const ensureDirectory = async (dirPath) => {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
      } else {
        throw error;
      }
    }
  };

  try {
    // Ensure Filesystem Structure
    await ensureDirectory(dbDirPath);
    await ensureDirectory(uploadsDir);
    await ensureDirectory(imagesDir);
    await ensureDirectory(filesDir);

    // Run Database Migrations
    // This creates tables defined in the /migrations folder
    console.log('System: Checking database schema...');
    await db.migrate.latest();
    console.log('System: Database is ready.');

  } catch (error) {
    console.error('System: Database initialization failed:', error);
    process.exit(1);
  }
};

module.exports = { initializeDatabase };
