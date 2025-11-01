const { describe, expect, beforeAll, test, afterAll } = require("@jest/globals");

const pool = require("../config/db");
const init = require("../config/init_db")

// (may want to move helper functions to a utils folder in future)
// -------------------------------- HELPER FUNCTIONS FOR TESTING ----------------------------------

const dropTables = async () => {
  await pool.query("DROP TABLE IF EXISTS document_history CASCADE");
  await pool.query("DROP TABLE IF EXISTS documents CASCADE");
}

const checkTableExists = async (tableName) => {
  const res = await pool.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = $1
    );`,
    [tableName]
  );
  return res.rows[0].exists;
}


// ------------------------------------------------------------------------------------------------

// CAN WE CONNECT TO THE DATABASE?
describe("Database Connection (db.js)", () => {
  test("should export a defined pool", () => {
    expect(pool).toBeDefined();
  });

  test("should be able to connect and release successfully", async () => {
    const client = await pool.connect();
    expect(client).toBeDefined();
    client.release();
  });
});

// DO DATABASE INITIALIZATIONS RUN?
describe("Database Initialization (init_db.js)", () => {
  beforeAll(async () => {
    await dropTables();
    await init();
  });

  test("init function should run without throwing errors", async () => {
    await expect(init()).resolves.not.toThrow();
  });

  test("documents table should exist", async () => {
    expect(await checkTableExists("documents")).toBe(true);
  });

  test("document_history table should exist", async () => {
    expect(await checkTableExists("document_history")).toBe(true);
  });
});

// DOES DOCUMENT HISTORY TABLE WORK?
describe("Document History Logic (Integration Test)", () => {
    let documentId;
    
    beforeEach(async () => {
        await pool.query("TRUNCATE documents CASCADE;"); 
    });

    test("createDocument operation should save data to both tables", async () => {
        const title = "Test Doc";
        const content = "Initial Content";

        const docRes = await pool.query(
            "INSERT INTO documents(title, content) VALUES ($1, $2) RETURNING id",
            [title, content]
        );
        documentId = docRes.rows[0].id;

        await pool.query(
            "INSERT INTO document_history(document_id, content) VALUES ($1, $2)",
            [documentId, content]
        );

        const mainCount = await pool.query("SELECT COUNT(*) FROM documents");
        expect(parseInt(mainCount.rows[0].count)).toBe(1);

        const historyCount = await pool.query("SELECT COUNT(*) FROM document_history");
        expect(parseInt(historyCount.rows[0].count)).toBe(1);
    });

    test("updateDocument operation should create a new history record", async () => {
        const setupRes = await pool.query(
            "INSERT INTO documents(title, content) VALUES ($1, $2) RETURNING id",
            ["Update Test", "Version 1"]
        );
        const testDocId = setupRes.rows[0].id;
        await pool.query(
            "INSERT INTO document_history(document_id, content) VALUES ($1, $2)",
            [testDocId, "Version 1"]
        );
        
        const newContent = "Version 2 Content";
        
        await pool.query(
            "INSERT INTO document_history(document_id, content) VALUES ($1, $2)",
            [testDocId, newContent]
        );

        await pool.query(
            "UPDATE documents SET content = $1 WHERE id = $2",
            [newContent, testDocId]
        );

        const historyCount = await pool.query("SELECT COUNT(*) FROM document_history WHERE document_id = $1", [testDocId]);
        expect(parseInt(historyCount.rows[0].count)).toBe(2);
    });

    test("deleting a document should cascade delete its history records", async () => {
        const setupRes = await pool.query(
            "INSERT INTO documents(title, content) VALUES ($1, $2) RETURNING id",
            ["Delete Test", "Content"]
        );
        const testDocId = setupRes.rows[0].id;
        await pool.query(
            "INSERT INTO document_history(document_id, content) VALUES ($1, $2)",
            [testDocId, "Content"]
        );
        
        const initialHistoryCount = await pool.query("SELECT COUNT(*) FROM document_history WHERE document_id = $1", [testDocId]);
        expect(parseInt(initialHistoryCount.rows[0].count)).toBe(1);

        await pool.query("DELETE FROM documents WHERE id = $1", [testDocId]);

        const docCheck = await pool.query("SELECT COUNT(*) FROM documents WHERE id = $1", [testDocId]);
        expect(parseInt(docCheck.rows[0].count)).toBe(0);

        const finalHistoryCount = await pool.query("SELECT COUNT(*) FROM document_history WHERE document_id = $1", [testDocId]);
        expect(parseInt(finalHistoryCount.rows[0].count)).toBe(0);
    });

    test("documentVersions query should return correct history content in descending order", async () => {
        const setupRes = await pool.query(
            "INSERT INTO documents(title, content) VALUES ($1, $2) RETURNING id",
            ["Retrieval Test", "V1"]
        );
        const testDocId = setupRes.rows[0].id;
        
        await pool.query("INSERT INTO document_history(document_id, content) VALUES ($1, $2)", [testDocId, "Version 1 Content"]);
        await pool.query("INSERT INTO document_history(document_id, content) VALUES ($1, $2)", [testDocId, "Version 2 Content"]);
        await pool.query("INSERT INTO document_history(document_id, content) VALUES ($1, $2)", [testDocId, "Version 3 Content"]);
        
        const historyRes = await pool.query(
            "SELECT content FROM document_history WHERE document_id = $1 ORDER BY saved_at DESC", 
            [testDocId]
        );

        const contents = historyRes.rows.map(r => r.content);
        
        expect(contents.length).toBe(3);
        expect(contents[0]).toBe("Version 3 Content");
        expect(contents[1]).toBe("Version 2 Content");
        expect(contents[2]).toBe("Version 1 Content");
    });

    afterAll(async () => {
        await dropTables(); 
        await pool.end();
    });
});