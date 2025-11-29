/**
 * Low-Level Database Access Layer
 */

const fs = require('fs/promises');
const path = require('path');

/** 
 * Absolute path to the JSON database file.
 */
const dbPath = path.join(__dirname, '..', 'db', 'database.json');

/**
 * Reads and parses the database file.
 */
const readDb = async () => {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Log the error for admin review but recover gracefully
    console.error("Error reading database:", error);
    // Return a compliant schema to prevent undefined errors in services
    return { items: [], details: [], categories: [] };
  }
};

/**
 * Serializes and writes data to the database file.
 */
const writeDb = async (data) => {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing to database:", error);
    throw error;
  }
};

module.exports = { readDb, writeDb };
