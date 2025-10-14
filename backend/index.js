require('dotenv').config();
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const cors = require("cors");

const { typeDefs, resolvers } = require("./schema");

const app = express();
app.use(cors()); // only needed if frontend and backend are hosted separately

async function startServer() {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer();