/**
 * Initial Schema Migration
 *
 * Creates the 'categories' and 'items' tables.
 * SQLite stores arrays/objects as JSON text strings.
 */

exports.up = function (knex) {
  return knex.schema
    .createTable('categories', (table) => {
      table.uuid('id').primary();
      table.string('name').notNullable();
      table.string('slug').notNullable();
      table.string('icon').defaultTo('fa-solid fa-folder');
    })
    .createTable('items', (table) => {
      table.uuid('id').primary();
      table.string('name').notNullable();
      table.string('slug').notNullable();
      table.uuid('categoryId').nullable();
      table.json('tags').defaultTo('[]');
      table.string('title').nullable();
      table.text('content').nullable();
      table.json('images').defaultTo('[]');
      table.string('filePath').nullable();
      table.string('externalLink').nullable();
      table.foreign('categoryId').references('categories.id').onDelete('SET NULL');
    });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('items').dropTableIfExists('categories');
};
