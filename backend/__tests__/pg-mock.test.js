const { describe, it, expect, beforeEach } = require('@jest/globals');

describe('pg mock integration test', () => {
  let pool;

  beforeEach(() => {
    // Clear any previous state
    jest.clearAllMocks();
    // Re-require to get a fresh pool instance
    jest.resetModules();
    pool = require('../config/db');
  });

  it('should use mocked pg Pool', async () => {
    // Verify we can query without connecting to a real database
    const result = await pool.query('SELECT * FROM documents');
    expect(result).toBeDefined();
    expect(result.rows).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it('should allow setting query responses', async () => {
    pool.setQueryResponses([
      {
        match: 'SELECT * FROM documents',
        result: { rows: [{ id: 1, title: 'Test Doc' }], rowCount: 1 }
      }
    ]);

    const result = await pool.query('SELECT * FROM documents');
    expect(result.rows).toEqual([{ id: 1, title: 'Test Doc' }]);
    expect(result.rowCount).toBe(1);
  });

  it('should track executed queries', async () => {
    await pool.query('SELECT * FROM documents WHERE id = $1', [1]);
    
    expect(pool.queries).toHaveLength(1);
    expect(pool.queries[0].text).toContain('SELECT * FROM documents');
    expect(pool.queries[0].params).toEqual([1]);
  });

  it('should support pool.connect() and client.query()', async () => {
    const client = await pool.connect();
    expect(client).toBeDefined();
    expect(typeof client.query).toBe('function');
    expect(typeof client.release).toBe('function');

    const result = await client.query('SELECT 1');
    expect(result).toBeDefined();
    
    client.release();
    expect(client.released).toBe(true);
  });

  it('should support pool.end()', async () => {
    await pool.end();
    expect(pool._ended).toBe(true);
  });

  it('should match queries using regex', async () => {
    pool.setQueryResponses([
      {
        match: /INSERT INTO documents/,
        result: { rows: [{ id: 5, title: 'New Doc' }], rowCount: 1 }
      }
    ]);

    const result = await pool.query('INSERT INTO documents(title) VALUES ($1) RETURNING *', ['New Doc']);
    expect(result.rows[0].id).toBe(5);
  });

  it('should support functional result for dynamic responses', async () => {
    pool.setQueryResponses([
      {
        match: 'SELECT * FROM documents WHERE id = $1',
        result: (text, params) => {
          return { rows: [{ id: params[0], title: `Doc ${params[0]}` }], rowCount: 1 };
        }
      }
    ]);

    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [42]);
    expect(result.rows[0].id).toBe(42);
    expect(result.rows[0].title).toBe('Doc 42');
  });
});
