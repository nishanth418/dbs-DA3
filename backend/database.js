const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const neo4jDb = require('./db-neo4j');

module.exports = {
  getDriver: neo4jDb.getDriver,
  runCypher: neo4jDb.runCypher,
  query: neo4jDb.runCypher,
  execute: neo4jDb.execute,
  syncRelationships: neo4jDb.syncRelationships,
  initDatabase: neo4jDb.initDatabase,
  verifyDatabase: neo4jDb.verifyDatabase,
  testConnection: neo4jDb.testConnection,
  getHealthStatus: neo4jDb.getHealthStatus,
  getApplicationTables: neo4jDb.getApplicationTables,
  REQUIRED_TABLES: neo4jDb.REQUIRED_TABLES,
  TABLE_TO_LABEL: neo4jDb.TABLE_TO_LABEL,
  TABLE_METADATA: neo4jDb.TABLE_METADATA,
  db: {
    // Backwards-compatible mock for any direct call
    prepare: () => ({ all: () => [], run: () => ({ changes: 0 }) }),
    exec: () => {}
  },
  isMySQL: () => false
};
