const { gql } = require('apollo-server-express');

const typeDefs = gql`
  # A user in the system
  type User {
    id: ID!
    name: String!
    email: String!
  }

  # A comment on a document
  type Comment {
    id: ID!
    text: String!
    author: User!
  }

  # The main document object
  type Document {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment!]
  }

  # Root queries
  type Query {
    "Retrieves all documents"
    documents: [Document!]
    "Retrieves a single document by its ID"
    document(id: ID!): Document
  }

  # Root mutations
  type Mutation {
    "Creates a new document"
    createDocument(title: String!, content: String!, authorId: ID!): Document
    "Updates an existing document"
    updateDocument(id: ID!, title: String, content: String): Document
    "Deletes a document by its ID"
    deleteDocument(id: ID!): Boolean
  }
`;

module.exports = typeDefs;