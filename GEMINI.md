# Gemini Project Context: Upwork Opportunity Matcher

## 1. Project Overview

This is a full-stack web application designed to help Upwork freelancers find relevant job opportunities. The tool fetches job postings from the Upwork API, allows users to manage your professional profile (combining data from Upwork and local additions), and provides a dashboard to view and filter job listings. A core planned feature is to use AI to analyze and rank jobs against the user's profile.

**Architecture:**

*   **Backend:** A Python server built with the **FastAPI** framework. It serves a REST API to the frontend and is responsible for all communication with the Upwork API, including OAuth2 authentication and GraphQL queries for data fetching. It also manages encrypted local storage for user profile additions.
*   **Frontend:** A modern Single-Page Application (SPA) built with **React** and **TypeScript**, using **Vite** for the development environment. It features a component-based architecture using `shadcn/ui` and is styled with **Tailwind CSS**. Client-side state and data fetching are managed by **TanStack React Query**.

## 2. Building and Running

### Backend (Python/FastAPI)

The backend server runs on port `8000`.

1.  **Setup Virtual Environment:**
    ```bash
    # Create and activate a Python virtual environment
    python -m venv venv
    source venv/bin/activate
    ```

2.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Environment:**
    *   Create a `.env` file in the project root.
    *   Add your Upwork API credentials (`UPWORK_CLIENT_ID`, `UPWORK_CLIENT_SECRET`), your freelancer profile key (`UPWORK_PROFILE_KEY`), and a unique `ENCRYPTION_KEY` for local data.

4.  **Run Server:**
    ```bash
    uvicorn backend.main:app --reload --port 8000
    ```

### Frontend (React/Vite)

The frontend development server runs on port `8080`.

1.  **Navigate to Directory:**
    ```bash
    cd frontend
    ```

2.  **Install Dependencies:**
    *   The project uses `bun` for package management.
    ```bash
    bun install
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## 3. Development Conventions

*   **API Communication:** The frontend communicates with the backend via a REST API. The backend communicates with the Upwork API primarily via GraphQL.
*   **Backend:**
    *   API endpoints and application logic are defined in `backend/main.py`.
    *   Logic for interacting with the Upwork API is abstracted in `backend/upwork_api.py`.
    *   Pydantic models are used for request and response validation.
    *   Sensitive user data stored locally is encrypted using the `cryptography` library, with logic in `backend/encryption.py` and `backend/local_profile_storage.py`.
*   **Frontend:**
    *   Components are written in TypeScript (`.tsx`) and located in `frontend/src/components`.
    *   API call functions are centralized in `frontend/src/lib/api.ts`.
    *   Asynchronous state management (data fetching, caching) is handled by `@tanstack/react-query`.
    *   UI is built using `shadcn/ui` components, which can be found in `frontend/src/components/ui`.

## 4. AI Model Usage

The application supports two AI providers: Google Gemini and AWS Bedrock.

*   **Approved Google Models:**
    *   `gemini-2.5-pro`
    *   `gemini-2.5-flash`

*   **Approved AWS Bedrock Models:**
    *   `us.amazon.nova-lite-v1:0`

*   **Legacy Models:** Do not use any `gemini-1.5` models. They are to be considered deprecated for this project.

## 5. Gemini API Integration

### Overview
The backend uses the `google-generativeai` Python library to interact with the Gemini API. The primary integration point is the `backend/gemini_api.py` module, which is responsible for analyzing job postings against a user's profile.

### Best Practices & Implementation

*   **Import Style:** Always use the recommended import statement to ensure all library components are available and to avoid namespace conflicts:
    ```python
    import google.generativeai as genai
    ```
    Using `from google import genai` can lead to `AttributeError` exceptions for functions like `genai.configure` or classes like `genai.GenerativeModel`.

*   **Configuration:** The API client should be configured once when the application starts using the API key from the environment variables:
    ```python
    genai.configure(api_key=os.getenv("GOOGLE_API"))
    ```

*   **Implementation Example (`gemini_api.py`):
    The following is a summary of the successful implementation for analyzing a job posting:
    ```python
    # In backend/gemini_api.py
    import google.generativeai as genai

    async def get_job_analysis(job_data: dict, profile_data: dict) -> dict:
        # ... (setup and prompt creation)

        model = genai.GenerativeModel('gemini-2.5-flash')

        generation_config = genai.types.GenerationConfig(
            response_mime_type="application/json"
        )

        response = await model.generate_content_async(
            # ... (prompt content)
            generation_config=generation_config
        )

        analysis_json = json.loads(response.text)
        return analysis_json
    ```

## AWS Bedrock Integration

### Overview
The application now supports AWS Bedrock as an alternative AI provider for job analysis and proposal generation. The integration uses the `boto3` Python library to interact with the Bedrock API. The primary integration point is the `backend/bedrock_api.py` module.

### Configuration
The user can select "AWS Bedrock" as the AI provider in the "AI Provider Configuration" section of their user profile.

Authentication is handled in two ways:
1.  **Environment Credentials (Recommended):** If the user's environment is already configured for AWS (e.g., via `aws configure`), the application will automatically use these credentials. The `AWS Access Key ID` and `AWS Secret Access Key` fields in the UI can be left blank.
2.  **Explicit Credentials:** The user can provide an `AWS Access Key ID` and `AWS Secret Access Key` directly in the UI to override environment credentials.

### Implementation Example (`bedrock_api.py`)
The following is a summary of the implementation for making an API call:

```python
# In backend/bedrock_api.py
import boto3

async def get_job_analysis(job_data: dict, profile_data: dict, api_config: dict) -> dict:
    # ... (setup and credential handling)

    client_args = {
        "service_name": "bedrock-runtime",
        "region_name": api_config.get("aws_region", "us-west-2")
    }

    # Use credentials from UI if provided, otherwise let boto3 find them
    if api_config.get("aws_access_key_id") and api_config.get("aws_secret_access_key"):
        client_args["aws_access_key_id"] = api_config["aws_access_key_id"]
        client_args["aws_secret_access_key"] = api_config["aws_secret_access_key"]

    client = boto3.client(**client_args)

    model_id = "us.amazon.nova-lite-v1:0"
    # ... (prompt creation and API call)

    response = client.converse(modelId=model_id, messages=messages)
    # ... (response parsing)
```

## 6. Upwork API GraphQL Notes

### Location Filtering

The correct way to filter by location in the `marketplaceJobPostingsSearch` query is to use a `location` object within the `marketPlaceJobFilter`. This filter only supports a single country at a time, using two-letter country codes.

**Example Query Variables:**
```json
{
  "marketPlaceJobFilter": {
    "location": {
      "country": "US"
    }
  },
  "searchType": "ALL",
  "sortAttributes": [
    {
      "attribute": "RELEVANT",
      "order": "DESC"
    }
  ]
}
```

## 7. GitHub Configuration

Upwork AI Job Matcher — GitHub Configuration (local reference)

Date: ${DATE}

Summary
- Branch created: development (do not merge to main).
- Remote set: origin → https://github.com/daniloedu/Upwork_AI_Job_Matcher.git
- Snapshot commit on development: "chore(repo): snapshot stable state and clean ignored artifacts".
- CODEOWNERS added to require owner review: .github/CODEOWNERS → "* @daniloedu" (committed on development).

Branch Protection (intended)
- main:
  - Require PR before merging.
  - Require at least 1 approving review.
  - Require review from Code Owners (enforces @daniloedu approval).
  - Enforce for admins.
  - Restrict who can push: only @daniloedu.
- development:
  - Enforce for admins.
  - Require Code Owner review when PRs are.
  - Optionally allow direct pushes by @daniloedu.

Draft PR (optional)
- Create a draft PR from development → main for later review.
- Link to start: https://github.com/daniloedu/Upwork_AI_Job_Matcher/pull/new/development

CLI commands (gh)
1) Protect main
   gh api -X PUT repos/daniloedu/Upwork_AI_Job_Matcher/branches/main/protection \
     -f required_status_checks.strict=true \
     -f enforce_admins=true \
     -f required_pull_request_reviews.required_approving_review_count=1 \
     -f required_pull_request_reviews.require_code_owner_reviews=true \
     -F restrictions=users='["daniloedu"]' \
     -H "Accept: application/vnd.github+json"

2) Protect development
   gh api -X PUT repos/daniloedu/Upwork_AI_Job_Matcher/branches/development/protection \
     -f required_status_checks.strict=false \
     -f enforce_admins=true \
     -f required_pull_request_reviews.required_approving_review_count=1 \
     -f required_pull_request_reviews.require_code_owner_reviews=true \
     -F restrictions=users='["daniloedu"]' \
     -H "Accept: application/vnd.github+json"

3) Create draft PR
   gh pr create --base main --head development \
     --title "Stabilize: development → main" \
     --body "Draft PR to prepare main release. Review required by @daniloedu."
     --draft

Notes
- .github/CODEOWNERS ensures only @daniloedu can satisfy required review when "Require review from Code Owners" is enabled.
- .env, venv, node_modules, and compiled artifacts are ignored via .gitignore.
