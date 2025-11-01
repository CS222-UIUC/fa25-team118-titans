const { describe, it, expect, beforeEach } = require('@jest/globals');

describe('GraphQL resolvers with mocked pg', () => {
  let resolvers;
  let pool;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    pool = require('../config/db');
    const schema = require('../graphql/schema');
    resolvers = schema.resolvers;
  });

  describe('Query.documents', () => {
    it('should return empty array when no documents', async () => {
      const result = await resolvers.Query.documents();
      expect(result).toEqual([]);
    });

    it('should return mapped documents from pool', async () => {
      pool.setQueryResponses([
        {
          match: 'SELECT id, title, content, last_modified FROM documents ORDER BY id',
          result: {
            rows: [
              { id: 1, title: 'Doc 1', content: 'Content 1', last_modified: new Date('2024-01-01') },
              { id: 2, title: 'Doc 2', content: 'Content 2', last_modified: new Date('2024-01-02') }
            ],
            rowCount: 2
          }
        }
      ]);

      const result = await resolvers.Query.documents();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].title).toBe('Doc 1');
      expect(result[1].id).toBe(2);
    });
  });

  describe('Query.document', () => {
    it('should return null when document not found', async () => {
      pool.setQueryResponses([
        {
          match: /SELECT.*WHERE id = \$1/,
          result: { rows: [], rowCount: 0 }
        }
      ]);

      const result = await resolvers.Query.document(null, { id: '999' });
      expect(result).toBeNull();
    });

    it('should return document by id', async () => {
      pool.setQueryResponses([
        {
          match: /SELECT.*WHERE id = \$1/,
          result: {
            rows: [{ id: 1, title: 'Doc 1', content: 'Content 1', last_modified: new Date('2024-01-01') }],
            rowCount: 1
          }
        }
      ]);

      const result = await resolvers.Query.document(null, { id: '1' });
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe('Doc 1');
    });
  });

  describe('Mutation.createDocument', () => {
    it('should create document and return it', async () => {
      pool.setQueryResponses([
        {
          match: /INSERT INTO documents/,
          result: {
            rows: [{ id: 3, title: 'New Doc', content: 'New Content', last_modified: new Date('2024-01-03') }],
            rowCount: 1
          }
        }
      ]);

      const result = await resolvers.Mutation.createDocument(null, { title: 'New Doc', content: 'New Content' });
      expect(result).toBeDefined();
      expect(result.id).toBe(3);
      expect(result.title).toBe('New Doc');
    });
  });

  describe('Mutation.deleteDocument', () => {
    it('should return true when document deleted', async () => {
      pool.setQueryResponses([
        {
          match: /DELETE FROM documents/,
          result: { rows: [], rowCount: 1 }
        }
      ]);

      const result = await resolvers.Mutation.deleteDocument(null, { id: '1' });
      expect(result).toBe(true);
    });

    it('should return false when document not found', async () => {
      pool.setQueryResponses([
        {
          match: /DELETE FROM documents/,
          result: { rows: [], rowCount: 0 }
        }
      ]);

      const result = await resolvers.Mutation.deleteDocument(null, { id: '999' });
      expect(result).toBe(false);
    });
  });
});