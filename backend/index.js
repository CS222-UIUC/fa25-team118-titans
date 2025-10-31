require('dotenv').config();
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const cors = require("cors");

const { typeDefs, resolvers } = require("./graphql/schema");
const initDb = require("./config/init_db");

const app = express();
app.use(cors()); // needed only when frontend and backend are hosted separately, which they are!

app.get('/admin/documents', async (req, res) => {
    try {
        const pool = require('./db');
        const result = await pool.query('SELECT id, title, content, last_modified FROM documents ORDER BY id');
        return res.json({ ok: true, documents: result.rows });
    } catch (err) {
        console.error('Failed to fetch documents for admin', err);
        return res.status(500).json({ ok: false, error: String(err) });
    }
});

async function startServer() {
    try {
        await initDb();
    } catch (err) {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    }

    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer();