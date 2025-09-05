# Gemini Project Context: Upwork Opportunity Matcher

## 1. Project Overview

This is a full-stack web application designed to help Upwork freelancers find relevant job opportunities. The tool fetches job postings from the Upwork API, allows users to manage their professional profile (combining data from Upwork and local additions), and provides a dashboard to view and filter job listings. A core planned feature is to use AI to analyze and rank jobs against the user's profile.

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

*   **Approved Models:** The following Google AI models are to be used for this project:
    *   `gemini-2.5-pro`
    *   `gemini-2.5-flash`

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
