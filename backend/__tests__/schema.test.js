const { resolvers } = require("../graphql/schema");
const pool = require("../config/db");

// Mock the entire database module to control return values
jest.mock("../config/db", () => ({
    query: jest.fn(),
}));

describe("GraphQL Resolvers: Document CRUD & Version History", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // do queries work?
    test("Query.documents should fetch and format all documents", async () => {
        const mockData = [
            { id: 1, title: "Doc 1", content: "Content A", last_modified: "2025-01-01T10:00:00Z" },
            { id: 2, title: "Doc 2", content: "Content B", last_modified: "2025-01-02T11:00:00Z" },
        ];
        pool.query.mockResolvedValueOnce({ rows: mockData });

        const result = await resolvers.Query.documents();
        
        expect(result).toHaveLength(2);
        expect(result[0].lastModified).toBe("2025-01-01T10:00:00Z"); // Check date format mapping
        expect(pool.query).toHaveBeenCalledWith(
            "SELECT id, title, content, last_modified FROM documents ORDER BY id"
        );
    });

    test("Query.document should fetch one document by ID", async () => {
        const mockRow = { id: 1, title: "Doc 1", content: "Hello", last_modified: "2025-01-01" };
        pool.query.mockResolvedValueOnce({ rows: [mockRow] });

        const result = await resolvers.Query.document(null, { id: 1 });
        
        expect(result.title).toBe("Doc 1");
        expect(pool.query).toHaveBeenCalledWith(
            "SELECT id, title, content, last_modified FROM documents WHERE id = $1",
            [1]
        );
    });

    test("Query.document should return null if document not found", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });
        const result = await resolvers.Query.document(null, { id: 99 });
        expect(result).toBeNull();
    });

    test("Query.documentVersions should fetch all history records for a document", async () => {
        const mockHistory = [
            { id: 3, content: "V3 (Latest)", saved_at: "2025-02-03" },
            { id: 2, content: "V2", saved_at: "2025-02-02" },
            { id: 1, content: "V1 (Initial)", saved_at: "2025-02-01" },
        ];
        pool.query.mockResolvedValueOnce({ rows: mockHistory });

        const result = await resolvers.Query.documentVersions(null, { documentId: 5 });
        
        expect(result).toHaveLength(3);
        expect(result[0].content).toBe("V3 (Latest)");
        expect(result[0].savedAt).toBe("2025-02-03");
        expect(pool.query).toHaveBeenCalledWith(
            "SELECT id, content, saved_at FROM document_history WHERE document_id = $1 ORDER BY saved_at DESC",
            [5]
        );
    });

    // do mutations work?
    test("Mutation.createDocument should insert into DOCUMENTS and DOCUMENT_HISTORY", async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{ id: 10, title: "New Doc", content: "Body", last_modified: "2025-02-01" }],
        });
        pool.query.mockResolvedValueOnce({}); 

        const result = await resolvers.Mutation.createDocument(null, {
            title: "New Doc",
            content: "Body",
        });

        expect(result.id).toBe(10);
        
        expect(pool.query).toHaveBeenCalledTimes(2);
        
        expect(pool.query).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining("INSERT INTO documents(title, content)"),
            ["New Doc", "Body"]
        );
        
        expect(pool.query).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining("INSERT INTO document_history(document_id, content)"),
            [10, "Body"]
        );
    });

    test("Mutation.updateDocument should insert into DOCUMENT_HISTORY then update DOCUMENTS", async () => {
        const updatedContent = "Updated body v2";
        const docId = 20;

        pool.query.mockResolvedValueOnce({}); 
        
        pool.query.mockResolvedValueOnce({
            rows: [{ id: docId, title: "Updated", content: updatedContent, last_modified: "2025-02-02" }],
        });

        const result = await resolvers.Mutation.updateDocument(null, {
            id: docId,
            title: "Updated",
            content: updatedContent,
        });

        expect(result.content).toBe(updatedContent);

        expect(pool.query).toHaveBeenCalledTimes(2);
        
        expect(pool.query).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining("INSERT INTO document_history(document_id, content)"),
            [docId, updatedContent]
        );
        
        expect(pool.query).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining("UPDATE documents SET"),
            expect.arrayContaining(["Updated", updatedContent, docId])
        );
    });

    test("Mutation.updateDocument should throw if no document found after update", async () => {
        pool.query.mockResolvedValueOnce({}); 
        pool.query.mockResolvedValueOnce({ rows: [] });

        await expect(
            resolvers.Mutation.updateDocument(null, { id: 99, title: "None" })
        ).rejects.toThrow("Document not found");
        
        expect(pool.query).toHaveBeenCalledTimes(2); 
    });

    test("Mutation.deleteDocument should return true when rowCount > 0", async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 1 });
        const result = await resolvers.Mutation.deleteDocument(null, { id: 1 });
        expect(result).toBe(true);
        expect(pool.query).toHaveBeenCalledWith("DELETE FROM documents WHERE id = $1", [1]);
    });

    test("Mutation.deleteDocument should return false when rowCount = 0", async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 0 });
        const result = await resolvers.Mutation.deleteDocument(null, { id: 1 });
        expect(result).toBe(false);
    });
});