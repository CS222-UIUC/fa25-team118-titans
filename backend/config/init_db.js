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

      CREATE TABLE IF NOT EXISTS document_history (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT,
        saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_document_history_document_id ON document_history (document_id);
    `);
    console.log("Tables are ready!!");
  } catch (err) {
    console.error("Error initializing database", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = init;