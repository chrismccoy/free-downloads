/**
 * Knex Configuration
 */
module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './db/database.sqlite',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations',
    },
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: './db/database.sqlite',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations',
    },
  },
};
