# Upwork Opportunity Matcher

An AI-powered, full-stack web application designed to help Upwork freelancers find relevant job opportunities. The tool fetches job postings from the Upwork API, allows you to manage your professional profile, and provides a dashboard to view, filter, and analyze job listings using AI.

## Architecture

-   **Backend:** A Python server built with the **FastAPI** framework. It serves a REST API to the frontend and is responsible for all communication with the Upwork API, including OAuth2 authentication and GraphQL queries.
-   **Frontend:** A modern Single-Page Application (SPA) built with **React** and **TypeScript**, using **Vite** for the development environment. The UI is built with **shadcn/ui** and styled with **Tailwind CSS**.

## Features

-   **Upwork Integration:** Securely authenticates with your Upwork account using OAuth2.
-   **Job Feed:** Fetches and displays relevant job postings from Upwork.
-   **AI-Powered Analysis:** Utilizes Google Gemini or AWS Bedrock to analyze job postings against your profile, providing insights and a suitability score.
-   **Proposal Generation:** Automatically generates a draft cover letter for promising opportunities.
-   **Profile Management:** View your Upwork profile and supplement it with additional local details.
-   **Dual AI Support:** Choose between Google Gemini and AWS Bedrock as your AI provider.
-   **Secure Credential Storage:** All sensitive keys and credentials are encrypted at rest.

## Getting Started

### Prerequisites

-   [Git](https://git-scm.com/)
-   [Python](https://www.python.org/downloads/) 3.8+
-   [Node.js](https://nodejs.org/en/)
-   [Bun](https://bun.sh/) (for frontend package management)

### 1. Clone the Repository

```bash
git clone https://github.com/daniloedu/UpworkOpportunityMatcher.git
cd UpworkOpportunityMatcher
```

### 2. Backend Setup (FastAPI)

1.  **Navigate to the project root directory.**

2.  **Create and activate a Python virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    # On Windows, use: venv\Scripts\activate
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### 3. Frontend Setup (React)

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install Node.js dependencies:**
    ```bash
    bun install
    ```

## Configuration

This project has two configuration methods, depending on the branch you are using.

### `stable-env` Branch (.env file)

This branch is configured using a traditional `.env` file in the project root. Create a file named `.env` and add the following variables:

```
# Upwork API Credentials
UPWORK_CLIENT_ID="YOUR_UPWORK_CLIENT_ID"
UPWORK_CLIENT_SECRET="YOUR_UPWORK_CLIENT_SECRET"
UPWORK_REDIRECT_URI="http://localhost:8000/oauth/callback" # Default for local dev

# Your Upwork Profile Key
UPWORK_PROFILE_KEY="YOUR_UPWORK_PROFILE_KEY" # e.g., "~0123456789abcdef"

# A unique key for encrypting local data. Generate a secure random key.
ENCRYPTION_KEY="YOUR_SECRET_ENCRYPTION_KEY"

# --- AI Provider Keys (only one set is needed at a time) ---

# For Google Gemini
GOOGLE_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"

# For AWS Bedrock (Optional, can use environment credentials)
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
AWS_REGION="us-west-2" # Or your preferred region
```

### `stable-ui` Branch (In-App Settings)

This branch allows for all credentials to be configured directly within the application's UI.

1.  Run the application (see below).
2.  Navigate to the **Settings** page using the gear icon in the header.
3.  Enter your credentials into the form and save.

## Running the Application

1.  **Run the Backend Server:**
    From the project root directory:
    ```bash
    uvicorn backend.main:app --reload --port 8000
    ```

2.  **Run the Frontend Server:**
    In a new terminal, from the `frontend` directory:
    ```bash
    npm run dev
    ```

3.  **Open the Application:**
    Navigate to `http://localhost:8080` in your web browser.