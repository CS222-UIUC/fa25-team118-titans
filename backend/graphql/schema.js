const { gql } = require("apollo-server-express");
const pool = require("../config/db");

const typeDefs = gql`
    scalar DateTime

    type Document {
        id: ID!
        title: String!
        content: String
        lastModified: DateTime
    }

    type Version {
        id: ID!
        content: String!
        savedAt: DateTime!
    }

    type Query {
        documents: [Document!]!
        document(id: ID!): Document
        documentVersions(documentId: ID!): [Version!]!
    }

    type Mutation {
        createDocument(title: String!, content: String): Document!
        updateDocument(id: ID!, title: String, content: String): Document!
        deleteDocument(id: ID!): Boolean!
        restoreDocumentVersion(documentId: ID!, versionId: ID!): Document!
    }
`;

const resolvers = {
    Query: {
        documents: async () => {
            const res = await pool.query("SELECT id, title, content, last_modified FROM documents ORDER BY id");
            return res.rows.map(r => ({ id: r.id, title: r.title, content: r.content, lastModified: r.last_modified }));
        },
        document: async (_, { id }) => {
            const res = await pool.query("SELECT id, title, content, last_modified FROM documents WHERE id = $1", [id]);
            const r = res.rows[0];
            if (!r) return null;
            return { id: r.id, title: r.title, content: r.content, lastModified: r.last_modified };
        },
        documentVersions: async(_, { documentId }) => {
            const res = await pool.query("SELECT id, content, saved_at FROM document_history WHERE document_id = $1 ORDER BY saved_at DESC", [documentId]);
            return res.rows.map(r => ({ id: r.id, content: r.content, savedAt: r.saved_at }));
        }
    },

    Mutation: {
        createDocument: async (_, { title, content }) => {
            const res = await pool.query(
                "INSERT INTO documents(title, content, last_modified) VALUES ($1, $2, now()) RETURNING id, title, content, last_modified",
                [title, content]
            );
            const r = res.rows[0];
            await pool.query("INSERT INTO document_history(document_id, content) VALUES ($1, $2)", 
                [r.id, content || ""]
            );
            return { id: r.id, title: r.title, content: r.content, lastModified: r.last_modified };
        },

        updateDocument: async (_, { id, title, content }) => {
        
            const fields = [];
            const values = [];
            let idx = 1;

            /*
             * NOTE: this is in a separate if block because content must be saved to history
             * BEFORE the main table is updated
             */
            if (content !== undefined) {
                await pool.query("INSERT INTO document_history(document_id, content) VALUES ($1, $2)",
                    [id, content]
                );
            }

            if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
            if (content !== undefined) { fields.push(`content = $${idx++}`); values.push(content); }
            fields.push(`last_modified = now()`);

            const setClause = fields.join(', ');
            const query = `UPDATE documents SET ${setClause} WHERE id = $${idx} RETURNING id, title, content, last_modified`;
            values.push(id);

            const res = await pool.query(query, values);
            const r = res.rows[0];
            if (!r) throw new Error("Document not found");
            return { id: r.id, title: r.title, content: r.content, lastModified: r.last_modified };
        },

        deleteDocument: async (_, { id }) => {
            const res = await pool.query("DELETE FROM documents WHERE id = $1", [id]);
            return res.rowCount > 0;
        },

        restoreDocumentVersion: async(_, { documentId, versionId }) => {
            const versionRes = await pool.query(
                "SELECT content FROM document_history where id = $1 AND document_id = $2", 
                [versionId, documentId]
            );
            if (versionRes.rows.length === 0) {
                throw new Error("Version not found for this document.");
            }

            const versionContent = versionRes.rows[0].content;
            await pool.query(
                "INSERT INTO document_history(document_id, content) VALUES ($1, $2)",
                [documentId, versionContent]
            );

            const docRes = await pool.query(
                "UPDATE documents SET content = $1, last_modified = now() WHERE id = $2 RETURNING id, title, content, last_modified",
                [versionContent, documentId]
            );
            if (docRes.rows.length === 0) throw new Error("Document not found.");
            
            const r = docRes.rows[0];
            return { id: r.id, title: r.title, content: r.content, lastModified: r.last_modified };
        },
    }
};

module.exports = { typeDefs, resolvers };