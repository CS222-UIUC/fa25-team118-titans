Thanks for considering contributing! A few simple guidelines to get changes in quickly:

- Fork the repository and create a branch for your changes (feature/bugfix/...).
- Keep changes small and focused — small PRs are reviewed faster.
- Run tests locally before submitting a PR:

```bash
cd frontend && npm install && npm test
cd backend && npm install && npm test
```

- If your change touches infrastructure (workflows, k8s), add clear documentation in the PR description.
- For security-sensitive changes (secrets, keys), do not commit secrets — provide instructions in the PR for reviewers.

Thanks! Maintain a friendly code review tone and feel free to ask for help in issues before starting larger work.
