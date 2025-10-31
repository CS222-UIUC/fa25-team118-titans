# CS 222 Project

React + Node.js document editor with real-time updates.

# Run Backend
```bash
cd backend
npm install
./init_postgres.sh
service postgresql start
node index.js
```

# Run Frontend
```bash
cd frontend
npm install
npm start
```

# View App
- Frontend: `localhost:3000`
- GraphQL Playground: `localhost:4000/graphql`

# Available GraphQL Queries
```graphql
# Get all documents
query {
  documents {
    id
    title
    content
    lastModified
  }
}

# Get single document
query {
  document(id: 1) {
    title
    content
  }
}

# Create document
mutation {
  createDocument(title: "Test", content: "Content") {
    id
    title
  }
}

# Update document
mutation {
  updateDocument(id: 1, title: "Updated", content: "New content") {
    id
    title
  }
}
```
