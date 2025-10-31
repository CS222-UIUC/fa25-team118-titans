const pool = require("./db");

// creating table on our backend if not already there!
async function init() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        last_modified TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    console.log('Documents table is ready!!');
  } catch (err) {
    console.error('Error initializing database', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = init;