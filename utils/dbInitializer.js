/**
 * Database Initializer
 */

const fs = require('fs/promises');
const path = require('path');

/**
 * Main initialization routine.
 * Executed once when the server starts.
 */
const initializeDatabase = async () => {
  const dbDirPath = path.join(__dirname, '..', 'db');
  const dbFilePath = path.join(dbDirPath, 'database.json');

  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
  const imagesDir = path.join(uploadsDir, 'images');
  const filesDir = path.join(uploadsDir, 'files'); 

  /**
   * Checks if a directory exists; if not, creates it (including parent folders).
   */
  const ensureDirectory = async (dirPath) => {
    try {
      // Check if directory exists/is accessible
      await fs.access(dirPath);
    } catch (error) {
      // ENOENT = Error No Entry (File/Dir not found)
      if (error.code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
      } else {
        // Re-throw permission errors or other FS issues
        throw error;
      }
    }
  };

  // Ensure DB Directory exists
  await ensureDirectory(dbDirPath);

  // Ensure Database File exists
  try {
    await fs.access(dbFilePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const defaultDb = { 
          items: [], 
          details: [], 
          categories: [] 
      }; 
      await fs.writeFile(dbFilePath, JSON.stringify(defaultDb, null, 2));
      console.log('System: Created new database.json');
    }
  }

  // Ensure Upload Directories exist (Public assets)
  await ensureDirectory(uploadsDir);
  await ensureDirectory(imagesDir);
  await ensureDirectory(filesDir);
};

module.exports = { initializeDatabase };
