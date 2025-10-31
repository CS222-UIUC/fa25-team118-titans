const { describe, expect } = require('@jest/globals');

const pool = require("../config/db");
const init = require("../config/init_db")


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
describe('Database Initialization (init_db.js)', () => {
  test('init function should be defined', () => {
    expect(init).toBeDefined();
    expect(typeof init).toBe('function');
  });

  test('should create documents table without throwing errors', async () => {
    await expect(init()).resolves.not.toThrow();
  });

  afterAll(async () => {
    // Cleanly close DB connections after tests
    await pool.end();
  });
});

