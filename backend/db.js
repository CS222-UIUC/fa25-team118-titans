const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://myuser:mypassword@localhost:5432/mydatabase';

const pool = new Pool({ connectionString });

module.exports = pool;
