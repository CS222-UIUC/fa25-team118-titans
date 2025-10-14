const { gql } = require("apollo-server-express");

const typeDefs = gql`
    type Query {
        hello: String
    }
`;

const resolvers = {
    Query: {
        hello: () => "Hello there! How ya doin",
    },
};

module.exports = { typeDefs, resolvers };