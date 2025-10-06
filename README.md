# Upwork Opportunity Matcher

This repository contains the source code for the Upwork Opportunity Matcher application.

## Branches

This project is organized into two main branches, each offering a different configuration experience:

### `stable-env`
This branch uses a traditional `.env` file for configuration. It is recommended for developers who are comfortable with command-line environments.

**[View the `stable-env` branch](https://github.com/daniloedu/UpworkOpportunityMatcher/tree/stable-env)**

### `stable-ui`
*** *Still work in progress.* This branch will feature a user-friendly, in-app settings page for configuration. This is recommended for users who prefer a graphical interface. Please note that this branch is currently a work in progress.

**[View the `stable-ui` branch](https://github.com/daniloedu/UpworkOpportunityMatcher/tree/stable-ui)**

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

### `stable-ui` Branch (In-App Settings) - IN PROGRESS

This branch allows for all credentials to be configured directly within the application's UI. This feature is currently under development and is not yet complete.

1.  Run the application (see below).
2.  Navigate to the **Settings** page using the gear icon in the header.
3.  Enter your credentials into the form and save.

## Running the Application

You can run the backend and frontend servers separately, or use the provided development script.

### Option 1: Using the Development Script (Recommended)

1.  **Activate your Python virtual environment** (if not already active).
2.  **From the project root directory, run:**
    ```bash
    ./run_dev.sh
    ```
    This script will start both the backend and frontend servers in the background. It will also provide PIDs to stop them later.
3.  **Open the Application:**
    Navigate to `http://localhost:8080` in your web browser.

### Option 2: Running Servers Separately

1.  **Run the Backend Server:**
    From the project root directory, with your virtual environment activated:
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