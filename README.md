# CS 222 Project — Titans Editor

A lightweight collaborative document editor (React frontend + Node.js GraphQL backend) with real-time sync using Yjs.

Quick links: Frontend -> `frontend/`, Backend -> `backend/`, Collab server -> `collab-server/`.

# Project Summary
Motivation: Existing document systems often suffer from slow updates and rigid architectures. We aimed to build a developer-friendly, full-stack platform that solves these pain points using modern systems and real-time synchronization.

# Developers:
**Shrest Das** - Docker + Kubernetes orchestration, AWS EC2 deployment, Collaboration, CI/CD pipeline  
**Maharsh Jani** - Frontend-Backend Integration, PostgreSQL, Frontend Features + Templates    
**Sean Patel** - Backend, GraphQL Queries, Version History, Commenting, Document Management  
**Nikhil Devarakonda** - Frontend, Version History  

# Visual Representation
<img width="745" height="433" alt="Screenshot 2025-12-15 at 11 46 52 PM" src="https://github.com/user-attachments/assets/e6c1001f-942b-426a-a10e-442f3747fc42" />

# Running it Locally

# Run Backend
```bash
cd backend
npm install
cd .. && chmod +x ./init_postgres.sh && ./init_postgres.sh && cd backend
service postgresql start
node backend/index.js
```

# Run Backend Testing
```bash
cd backend
npm test
npm run lint
```

# Run Frontend
```bash
cd frontend
npm install
npm start
```

# Run Frontend Testing
```bash
cd frontend
npm test
npx eslint src/ --ext .js,.jsx 
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
## Deployment to EC2 (GitHub Actions)

This project includes a GitHub Actions workflow that builds Docker images for the backend and frontend,
pushes them to Docker Hub, and then SSHs into an EC2 instance to run `docker compose pull` and
`docker compose up -d` to deploy the latest images.

Required repository secrets (Settings → Secrets → Actions):
- `DOCKER_USERNAME` - Docker Hub username used to push images
- `DOCKER_PASSWORD` - Docker Hub password or access token
- `EC2_HOST` - Public IP or DNS name of the EC2 instance
- `EC2_USER` - SSH username (e.g., `ubuntu`)
- `EC2_SSH_KEY` - The private SSH key (in PEM format) for the `EC2_USER` (no passphrase)
- `EC2_SSH_PORT` - SSH port (optional; set to `22` if omitted)

Server-side setup (one-time on the EC2 instance):
1. Install Docker and Docker Compose v2:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

2. Create a deploy directory and give it a name matching the repository (example used by the workflow):

```bash
mkdir -p ~/fa25-team118-titans
cd ~/fa25-team118-titans
# place project's docker-compose.yml here (the workflow copies it)
```

3. Make sure the EC2 user can run docker commands and has enough permissions.

How the workflow works (high level):
- Builds backend and frontend Docker images and pushes them to Docker Hub using `DOCKER_*` secrets.
- Copies `docker-compose.yml` and a small `deploy.sh` script to `~/fa25-team118-titans` on the EC2 host via SCP.
- SSHs into the EC2 host and runs `deploy.sh`, which runs `docker compose pull` and `docker compose up -d`.

Security notes:
- Keep `EC2_SSH_KEY` and Docker Hub credentials secret. Prefer using a Docker Hub access token over a password.
- Consider restricting SSH access to GitHub Actions runner IP ranges or using a bastion host.

## Kubernetes deployment (GitHub Actions)

This repo also now includes a `deploy-k8s` GitHub Actions workflow that builds backend/frontend Docker images,
pushes them to Docker Hub, and applies Kubernetes manifests in the `k8s/` directory.

Required repository secrets for Kubernetes deploy:
- `DOCKER_USERNAME` - Docker Hub username used to push images
- `DOCKER_PASSWORD` - Docker Hub password or access token
- `KUBECONFIG` - base64-encoded kubeconfig file for a service account or user that can apply manifests (keep secret)

What the workflow does:
- Builds backend/frontend images and tags them with the commit SHA.
- Restores `kubeconfig` from the `KUBECONFIG` secret and writes it to `$HOME/.kube/config`.
- Replaces placeholders in the manifests under `k8s/` with the pushed image tags and applies the manifests.

Notes:
- The provided manifests will continue to be worked on.

```bash
gh secret set DOCKER_USERNAME --body "${DOCKER_USERNAME}"
gh secret set DOCKER_PASSWORD --body "${DOCKER_PASSWORD}"
base64 -w0 $HOME/.kube/config | gh secret set KUBECONFIG --body -
```
 
## Collaborative editing (Yjs)

This repository includes a lightweight collaboration server using Yjs and `y-websocket` for local development and experimentation.

This repository now includes a lightweight collaboration server using Yjs and `y-websocket`.

What was added:
- `collab-server/` — a small Yjs websocket server (listens on port `1234` by default).
- `collab-server/Dockerfile` and `collab-server/package.json` so the server can be run via Docker.
- `docker-compose.yml` includes a `collab` service exposed at `ws://localhost:1234` for local development.
- `docker-compose.yml` was updated to add a `collab` service exposed on `ws://localhost:1234` for local development.
- Frontend integration in `frontend/src/components/DocsFrontend.jsx` connects to the collab server and syncs document HTML via a `Y.Text` named `content`.
- Frontend integration in `frontend/src/components/DocsFrontend.jsx` that connects to the collab server and syncs document HTML via a `Y.Text` named `content`.

Quick start (development):

1. Build and start services (this will build the collab server image and start it):

```bash
docker compose up --build
```

2. Install frontend deps and run frontend (if not running in Docker):

```bash
cd frontend
npm install
npm start
```

3. Open the app in two browser windows and open the same document — edits should sync in near real-time via the collab server.

Notes:
- The current client writes the full editor `innerHTML` into Y.Text on each input. This is a pragmatic starting point but not optimal for cursor preservation or efficient edits.
- For production use, consider a proper editor binding (ProseMirror/TipTap/Quill) and secure the collab server (TLS + auth).

Notes and next steps:
- The current client writes the full editor `innerHTML` into Y.Text on each input. This is a pragmatic starting point but not optimal for cursor preservation or efficient edits.
