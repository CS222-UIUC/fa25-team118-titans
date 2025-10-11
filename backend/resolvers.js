// Mock data for initial setup
const mockUsers = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];

const mockComments = [
  { id: '101', text: 'Great point!', authorId: '2' },
  { id: '102', text: 'I agree completely.', authorId: '1' },
];

const mockDocuments = [
  {
    id: 'doc1',
    title: 'My First Document',
    content: 'This is the content of the first document.',
    authorId: '1',
    commentIds: ['101', '102'],
  },
  {
    id: 'doc2',
    title: 'GraphQL is Awesome',
    content: 'Learning about GraphQL resolvers.',
    authorId: '2',
    commentIds: [],
  },
];


const resolvers = {
  Query: {
    documents: () => mockDocuments,
    document: (_, { id }) => mockDocuments.find(doc => doc.id === id),
  },

  Mutation: {
    // Placeholder mutations - they don't actually change the data yet
    createDocument: (_, { title, content, authorId }) => {
      const newDoc = {
        id: `doc${Date.now()}`,
        title,
        content,
        authorId,
        commentIds: [],
      };
      console.log('Pretending to create document:', newDoc);
      return newDoc; // In a real app, you'd save this to the DB
    },
    updateDocument: (_, { id, title, content }) => {
      const doc = mockDocuments.find(d => d.id === id);
      if (!doc) return null;
      console.log(`Pretending to update document ${id}`);
      return { ...doc, title: title || doc.title, content: content || doc.content };
    },
    deleteDocument: (_, { id }) => {
        console.log(`Pretending to delete document ${id}`);
        return true; // Indicate success
    }
  },

  // Field resolvers to link related data
  Document: {
    author: (parent) => mockUsers.find(user => user.id === parent.authorId),
    comments: (parent) => mockComments.filter(comment => parent.commentIds.includes(comment.id)),
  },
  Comment: {
    author: (parent) => mockUsers.find(user => user.id === parent.authorId),
  },
};

module.exports = resolvers;