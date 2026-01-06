/**
 * Migration Utility
 *
 * Reads the 'database.json' file and inserts data
 * into a SQLite database
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

const jsonPath = path.join(__dirname, '..', 'db', 'database.json');

const migrate = async () => {
  console.log('-----------------------------------------------------');
  console.log('📦  Starting Migration: JSON -> SQLite');
  console.log('-----------------------------------------------------');

  try {
    // Check if JSON file exists
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Source file not found: ${jsonPath}`);
    }

    // Read and Parse JSON
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);

    console.log(`📖  Read ${data.categories?.length || 0} categories and ${data.items?.length || 0} items from JSON.`);

    // Clean existing SQLite Tables
    // We actually delete items first because items depend on categories.
    await db('items').del();
    await db('categories').del();
    console.log('🧹  Existing SQLite data cleared.');

    // Migrate Categories
    if (data.categories && data.categories.length > 0) {
      await db('categories').insert(data.categories);
      console.log(`✅  Migrated ${data.categories.length} Categories.`);
    }

    // Migrate Items
    if (data.items && data.items.length > 0) {
      const formattedItems = data.items.map((item) => {
        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          categoryId: item.categoryId || null,
          tags: JSON.stringify(item.tags || []),
          title: item.title || item.name,
          content: item.content || '',
          images: JSON.stringify(item.images || []),
          filePath: item.filePath || null,
          externalLink: item.externalLink || null,
        };
      });

      // Batch Insert
      await db('items').insert(formattedItems);
      console.log(`✅  Migrated ${data.items.length} Items.`);
    }

    console.log('-----------------------------------------------------');
    console.log('🎉  Migration Complete. You may now start the server.');
    console.log('-----------------------------------------------------');

  } catch (error) {
    console.error('❌  MIGRATION FAILED:', error);
  } finally {
    // Close Database Connection
    await db.destroy();
  }
};

// Execute
migrate();
