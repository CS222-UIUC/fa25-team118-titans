const { describe, it, expect, beforeEach } = require("@jest/globals");

describe("GraphQL resolvers with mocked pg", () => {
  let resolvers;
  let pool;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    pool = require("../config/db");
    const schema = require("../graphql/schema");
    resolvers = schema.resolvers;
  });

  describe("Query.documents", () => {
    it("should return empty array when no documents", async () => {
      const result = await resolvers.Query.documents();
      expect(result).toEqual([]);
    });

    it("should return mapped documents from pool", async () => {
      pool.setQueryResponses([
        {
          match: "SELECT id, title, content, last_modified FROM documents ORDER BY id",
          result: {
            rows: [
              { id: 1, title: "Doc 1", content: "Content 1", last_modified: new Date("2024-01-01") },
              { id: 2, title: "Doc 2", content: "Content 2", last_modified: new Date("2024-01-02") }
            ],
            rowCount: 2
          }
        }
      ]);

      const result = await resolvers.Query.documents();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].title).toBe("Doc 1");
      expect(result[1].id).toBe(2);
    });
  });

  describe("Query.document", () => {
    it("should return null when document not found", async () => {
      pool.setQueryResponses([
        {
          match: /SELECT.*WHERE id = \$1/,
          result: { rows: [], rowCount: 0 }
        }
      ]);

      const result = await resolvers.Query.document(null, { id: "999" });
      expect(result).toBeNull();
    });

    it("should return document by id", async () => {
      pool.setQueryResponses([
        {
          match: /SELECT.*WHERE id = \$1/,
          result: {
            rows: [{ id: 1, title: "Doc 1", content: "Content 1", last_modified: new Date("2024-01-01") }],
            rowCount: 1
          }
        }
      ]);

      const result = await resolvers.Query.document(null, { id: "1" });
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe("Doc 1");
    });
  });

  describe("Query.documentVersions", () => {
    it("should return version history for a document", async () => {
      const documentId = 1;
      pool.setQueryResponses([
        {
          match: "SELECT id, content, saved_at FROM document_history",
          result: {
            rows: [
              { id: 10, content: "<p>Old version</p>", saved_at: new Date("2024-01-01") },
              { id: 11, content: "<p>Newer version</p>", saved_at: new Date("2024-01-02") }
            ],
            rowCount: 2
          }
        }
      ]);

      const result = await resolvers.Query.documentVersions(null, { documentId });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(10);
      expect(result[0].content).toBe("<p>Old version</p>");
      expect(result[1].id).toBe(11);
      expect(result[1].content).toBe("<p>Newer version</p>");
    });

    it("should return empty array when no versions exist", async () => {
      const documentId = 999;
      pool.setQueryResponses([
        { match: "SELECT id, content, saved_at FROM document_history", result: { rows: [], rowCount: 0 } }
      ]);

      const result = await resolvers.Query.documentVersions(null, { documentId });
      expect(result).toEqual([]);
    });
  });

  describe("Mutation.createDocument", () => {
    it("should create document and return it", async () => {
      pool.setQueryResponses([
        {
          match: /INSERT INTO documents/,
          result: {
            rows: [{ id: 3, title: "New Doc", content: "New Content", last_modified: new Date("2024-01-03") }],
            rowCount: 1
          }
        }
      ]);

      const result = await resolvers.Mutation.createDocument(null, { title: "New Doc", content: "New Content" });
      expect(result).toBeDefined();
      expect(result.id).toBe(3);
      expect(result.title).toBe("New Doc");
    });
  });

  describe("Mutation.deleteDocument", () => {
    it("should return true when document deleted", async () => {
      pool.setQueryResponses([
        { match: /DELETE FROM documents/, result: { rows: [], rowCount: 1 } }
      ]);

      const result = await resolvers.Mutation.deleteDocument(null, { id: "1" });
      expect(result).toBe(true);
    });

    it("should return false when document not found", async () => {
      pool.setQueryResponses([
        { match: /DELETE FROM documents/, result: { rows: [], rowCount: 0 } }
      ]);

      const result = await resolvers.Mutation.deleteDocument(null, { id: "999" });
      expect(result).toBe(false);
    });
  });

  describe("Mutation.restoreDocumentVersion", () => {
    it("should restore a previous version", async () => {
      const documentId = 1;
      const versionId = 10;
      const versionContent = "<p>Restored content</p>";
      const updatedDoc = { id: 1, title: "Doc 1", content: versionContent, last_modified: new Date() };

      pool.setQueryResponses([
        {
          match: "SELECT content FROM document_history",
          result: { rows: [{ content: versionContent }], rowCount: 1 }
        },
        {
          match: "INSERT INTO document_history",
          result: { rows: [{ id: 12, content: versionContent }], rowCount: 1 }
        },
        {
          match: "UPDATE documents SET",
          result: { rows: [updatedDoc], rowCount: 1 }
        }
      ]);

      const result = await resolvers.Mutation.restoreDocumentVersion(null, { documentId, versionId }, { pool });
      expect(result).toBeDefined();
      expect(result.id).toBe(updatedDoc.id);
      expect(result.content).toBe(versionContent);
    });

    it("should throw if version not found", async () => {
      pool.setQueryResponses([
        { match: "SELECT content FROM document_history", result: { rows: [], rowCount: 0 } }
      ]);

      await expect(
        resolvers.Mutation.restoreDocumentVersion(null, { documentId: 1, versionId: 99 }, { pool })
      ).rejects.toThrow("Version not found for this document");
    });

    it("should throw if document not found", async () => {
      const versionContent = "<p>Content</p>";

      pool.setQueryResponses([
        { match: "SELECT content FROM document_history", result: { rows: [{ content: versionContent }], rowCount: 1 } },
        { match: "INSERT INTO document_history", result: { rows: [{ id: 13, content: versionContent }], rowCount: 1 } },
        { match: "UPDATE documents SET", result: { rows: [], rowCount: 0 } }
      ]);

      await expect(
        resolvers.Mutation.restoreDocumentVersion(null, { documentId: 1, versionId: 10 }, { pool })
      ).rejects.toThrow("Document not found");
    });
  });

  describe("Mutation.updateDocument edge cases", () => {
    it("should throw error if document not found", async () => {
      pool.setQueryResponses([
        {
          match: /INSERT INTO document_history/,
          result: { rows: [], rowCount: 0 }
        },
        {
          match: /UPDATE documents/,
          result: { rows: [], rowCount: 0 } // simulate no rows updated
        }
      ]);

      await expect(
        resolvers.Mutation.updateDocument(null, { id: 999, content: "Does not exist" })
      ).rejects.toThrow("Document not found");
    });

    it("should update only title if content not provided", async () => {
      pool.setQueryResponses([
        {
          match: /UPDATE documents/,
          result: { rows: [{ id: 1, title: "Updated Title", content: "Existing Content", last_modified: new Date() }], rowCount: 1 }
        }
      ]);

      const result = await resolvers.Mutation.updateDocument(null, { id: 1, title: "Updated Title" });
      expect(result).toBeDefined();
      expect(result.title).toBe("Updated Title");
      expect(result.content).toBe("Existing Content");
    });

    it("should update only content if title not provided", async () => {
      pool.setQueryResponses([
        {
          match: /INSERT INTO document_history/,
          result: { rows: [{ id: 101, content: "New Content", saved_at: new Date() }], rowCount: 1 }
        },
        {
          match: /UPDATE documents/,
          result: { rows: [{ id: 1, title: "Existing Title", content: "New Content", last_modified: new Date() }], rowCount: 1 }
        }
      ]);

      const result = await resolvers.Mutation.updateDocument(null, { id: 1, content: "New Content" });
      expect(result).toBeDefined();
      expect(result.content).toBe("New Content");
      expect(result.title).toBe("Existing Title");
    });
  });
  
  describe("Mutation.deleteDocument edge cases", () => {
    it("should return false if document not found", async () => {
      pool.setQueryResponses([
        { match: /DELETE FROM documents/, result: { rows: [], rowCount: 0 } }
      ]);

      const result = await resolvers.Mutation.deleteDocument(null, { id: 999 });
      expect(result).toBe(false);
    });

    it("should return true if document deleted successfully", async () => {
      pool.setQueryResponses([
        { match: /DELETE FROM documents/, result: { rows: [], rowCount: 1 } }
      ]);

      const result = await resolvers.Mutation.deleteDocument(null, { id: 1 });
      expect(result).toBe(true);
    });
  });

});
