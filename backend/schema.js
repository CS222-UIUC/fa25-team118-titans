const { gql } = require("apollo-server-express");
const pool = require('./db');

const typeDefs = gql`
    scalar DateTime

    type Document {
        id: ID!
        title: String!
        content: String
        lastModified: DateTime
    }

    type Query {
        documents: [Document!]!
        document(id: ID!): Document
    }

    type Mutation {
        createDocument(title: String!, content: String): Document!
        updateDocument(id: ID!, title: String, content: String): Document!
        deleteDocument(id: ID!): Boolean!
    }
`;

const resolvers = {
    Query: {
        documents: async () => {
            const res = await pool.query('SELECT id, title, content, last_modified FROM documents ORDER BY id');
            return res.rows.map(r => ({ id: r.id, title: r.title, content: r.content, lastModified: r.last_modified }));
        },
        document: async (_, { id }) => {
            const res = await pool.query('SELECT id, title, content, last_modified FROM documents WHERE id = $1', [id]);
            const r = res.rows[0];
            if (!r) return null;
            return { id: r.id, title: r.title, content: r.content, lastModified: r.last_modified };
        }
    },

    Mutation: {
        createDocument: async (_, { title, content }) => {
            const res = await pool.query(
                'INSERT INTO documents(title, content, last_modified) VALUES ($1, $2, now()) RETURNING id, title, content, last_modified',
                [title, content]
            );
            const r = res.rows[0];
            return { id: r.id, title: r.title, content: r.content, lastModified: r.last_modified };
        },

        updateDocument: async (_, { id, title, content }) => {
        
            const fields = [];
            const values = [];
            let idx = 1;
            if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
            if (content !== undefined) { fields.push(`content = $${idx++}`); values.push(content); }
            fields.push(`last_modified = now()`);

            const setClause = fields.join(', ');
            const query = `UPDATE documents SET ${setClause} WHERE id = $${idx} RETURNING id, title, content, last_modified`;
            values.push(id);

            const res = await pool.query(query, values);
            const r = res.rows[0];
            if (!r) throw new Error('Document not found');
            return { id: r.id, title: r.title, content: r.content, lastModified: r.last_modified };
        },

        deleteDocument: async (_, { id }) => {
            const res = await pool.query('DELETE FROM documents WHERE id = $1', [id]);
            return res.rowCount > 0;
        }
    }
};

module.exports = { typeDefs, resolvers };