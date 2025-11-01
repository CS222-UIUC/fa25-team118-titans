const { describe, it, expect } = require('@jest/globals');

describe('init_db with mocked pg', () => {
  it('should not attempt real database connection', async () => {
    const pool = require('../config/db');
    
    pool.setQueryResponses([
      {
        match: /CREATE TABLE IF NOT EXISTS documents/,
        result: { rows: [], rowCount: 0 }
      }
    ]);

    const init = require('../config/init_db');
    
    await expect(init()).resolves.not.toThrow();
    
    expect(pool.queries.length).toBeGreaterThan(0);
    expect(pool.queries[0].text).toContain('CREATE TABLE IF NOT EXISTS documents');
  });
});