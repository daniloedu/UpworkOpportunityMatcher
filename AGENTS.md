# Repository Guidelines

## Project Structure & Module Organization
- backend: FastAPI app (`backend/main.py`) and Upwork API client (`backend/upwork_api.py`). Exposes `app` for Uvicorn.
- frontend: React + Vite + TypeScript + Tailwind (`frontend/src`, `frontend/index.html`).
- examples: Minimal Upwork OAuth/client library and tests (`examples/upwork`, `examples/tests`).
- docs: Reference docs (various `*.md` in repo root).
- config: Runtime env in `.env` (client ID/secret, redirect URI, tokens, `FRONTEND_URL`). Never commit secrets.

## Architecture Overview
- Purpose: Fetch Upwork opportunities via filtered GraphQL queries and present them in a clean, responsive UI.
- Flow: Frontend (Vite/React) → Backend (FastAPI) → Upwork OAuth2 + GraphQL.
- Key endpoints: `/login`, `/oauth/callback`, `/auth/status`, `/filters/categories`, `/jobs/fetch`, `/healthz`.
- Tokens: Access/refresh tokens are stored in `.env` by the backend OAuth callback.

## Build, Test, and Development Commands
- Python env: `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- Backend (dev): `uvicorn backend.main:app --reload --port 8000`
- Frontend (dev): `cd frontend && npm install && npm run dev` (Vite on port 5173)
- Lint (frontend): `cd frontend && npm run lint`
- Tests (examples/lib): `pytest examples/tests -q`

## Coding Style & Naming Conventions
- Python: PEP8, 4‑space indent, type hints for public functions; modules snake_case, classes PascalCase, functions snake_case.
- TypeScript/React: Follow existing ESLint config (`frontend/eslint.config.js`); components PascalCase, files kebab/snake for non-components; prefer functional components and hooks.
- Formatting: Keep imports grouped/stdlib→third‑party→local; short, descriptive names; avoid large modules—split by domain (auth, jobs, ui, etc.).

## Testing Guidelines
- Python tests: Use `pytest`; place new tests under `backend/tests/` or extend `examples/tests/`. Name `test_*.py` and test public behavior.
- Coverage: Aim for critical paths (OAuth callback, auth status, job search pagination). Add regression tests for fixed bugs.
- Frontend: If adding tests, prefer Vitest + React Testing Library; colocate as `Component.test.tsx`.

## Commit & Pull Request Guidelines
- Commits: Imperative tense, scoped type. Example: `feat(backend): add categories endpoint` or `fix(frontend): handle empty job list`.
- PRs: Clear description, linked issue, reproduction steps, and expected behavior. Include screenshots/GIFs for UI changes and sample API requests for backend changes.
- Checks: Ensure `npm run lint` passes and backend starts cleanly (`/healthz` returns ok). Update docs when APIs or envs change.

## Security & Configuration Tips
- Required env: `UPWORK_CLIENT_ID`, `UPWORK_CLIENT_SECRET`, `UPWORK_REDIRECT_URI`, `FRONTEND_URL`. Backend persists tokens to `.env`; rotate when needed.
- Do not log secrets; sanitize request/response logs. Keep CORS origins restricted in `backend/main.py`.

## Documentation & API References
- Source of truth: `technical_specifications.md` (flows, errors, pagination, data contracts).
- Upwork API docs in-repo: `upwork-api-authentication.md`, `upwork-api-jobs-docs.md`, `upwork-categories-api.md` (OAuth, job search filters/pagination, categories schema).
- Keep code and comments consistent with these docs; update the relevant file in the same PR when behavior or parameters change.
