const { describe, it, expect } = require('@jest/globals');

describe('init_db with mocked pg', () => {
  it('should not attempt real database connection', async () => {
    // This would fail with ECONNREFUSED without the mock
    const pool = require('../config/db');
    
    // Setup mock to succeed on CREATE TABLE
    pool.setQueryResponses([
      {
        match: /CREATE TABLE IF NOT EXISTS documents/,
        result: { rows: [], rowCount: 0 }
      }
    ]);

    const init = require('../config/init_db');
    
    // This should succeed without trying to connect to a real database
    await expect(init()).resolves.not.toThrow();
    
    // Verify the CREATE TABLE query was executed
    expect(pool.queries.length).toBeGreaterThan(0);
    expect(pool.queries[0].text).toContain('CREATE TABLE IF NOT EXISTS documents');
  });
});
