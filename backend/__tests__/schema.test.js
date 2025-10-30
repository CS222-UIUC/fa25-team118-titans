const { resolvers } = require("../graphql/schema");
const pool = require("../config/db");

// Mock database connection for testing API queries and mutations
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

describe("GraphQL Schema Resolvers (Core Queries & Mutations)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // do queries work?
  test('Query.documents should return all documents', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, title: 'Doc 1', content: 'Content 1', last_modified: '2025-01-01' },
        { id: 2, title: 'Doc 2', content: 'Content 2', last_modified: '2025-01-02' },
      ],
    });

    const result = await resolvers.Query.documents();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 1,
      title: 'Doc 1',
      content: 'Content 1',
      lastModified: '2025-01-01',
    });
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, title, content, last_modified FROM documents ORDER BY id'
    );
  });

  test('Query.document should return one document by ID', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: 'Doc 1', content: 'Hello', last_modified: '2025-01-01' }],
    });

    const result = await resolvers.Query.document(null, { id: 1 });
    expect(result).toEqual({
      id: 1,
      title: 'Doc 1',
      content: 'Hello',
      lastModified: '2025-01-01',
    });
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, title, content, last_modified FROM documents WHERE id = $1',
      [1]
    );
  });

  test('Query.document should return null if document not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const result = await resolvers.Query.document(null, { id: 99 });
    expect(result).toBeNull();
  });

  // do mutations work?
  test('Mutation.createDocument should insert and return a new document', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: 'New Doc', content: 'Body', last_modified: '2025-02-01' }],
    });

    const result = await resolvers.Mutation.createDocument(null, {
      title: 'New Doc',
      content: 'Body',
    });

    expect(result.title).toBe('New Doc');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO documents'),
      ['New Doc', 'Body']
    );
  });

  test('Mutation.updateDocument should update and return the document', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, title: 'Updated', content: 'Updated body', last_modified: '2025-02-02' }],
    });

    const result = await resolvers.Mutation.updateDocument(null, {
      id: 1,
      title: 'Updated',
      content: 'Updated body',
    });

    expect(result.id).toBe(1);
    expect(result.title).toBe('Updated');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE documents SET'),
      expect.arrayContaining(['Updated', 'Updated body', 1])
    );
  });

  test('Mutation.updateDocument should throw if no document found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(
      resolvers.Mutation.updateDocument(null, { id: 99, title: 'None' })
    ).rejects.toThrow('Document not found');
  });

  test('Mutation.deleteDocument should return true when rowCount > 0', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });
    const result = await resolvers.Mutation.deleteDocument(null, { id: 1 });
    expect(result).toBe(true);
  });

  test('Mutation.deleteDocument should return false when rowCount = 0', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });
    const result = await resolvers.Mutation.deleteDocument(null, { id: 1 });
    expect(result).toBe(false);
  });
});
