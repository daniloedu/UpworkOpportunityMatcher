# backend/main.py
import os
import logging
from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from dotenv import load_dotenv, set_key
import urllib.parse
import httpx
from pydantic import BaseModel
from typing import Optional, List

from fastapi.middleware.cors import CORSMiddleware
from . import upwork_api, local_profile_storage, gemini_api

# --- Configuration & Setup ---
DOTENV_PATH = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=DOTENV_PATH)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

UPWORK_CLIENT_ID = os.getenv("UPWORK_CLIENT_ID")
UPWORK_CLIENT_SECRET = os.getenv("UPWORK_CLIENT_SECRET")
UPWORK_REDIRECT_URI = os.getenv("UPWORK_REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")

if not all([UPWORK_CLIENT_ID, UPWORK_CLIENT_SECRET, UPWORK_REDIRECT_URI]):
    logger.error("FATAL: Missing Upwork API credentials in .env file")
    exit("Missing environment variables.")

UPWORK_OAUTH_BASE_URL = "https://www.upwork.com/ab/account-security/oauth2/authorize"
UPWORK_TOKEN_ENDPOINT = "https://www.upwork.com/api/v3/oauth2/token"

# --- Pydantic Models ---
class JobSearchRequest(BaseModel):
    query: Optional[str] = None
    category_ids: Optional[List[str]] = None
    first: int = 50
    after: Optional[str] = None

class LocalProfileData(BaseModel):
    location: Optional[str] = ""
    additional_details: Optional[str] = ""
    local_skills: Optional[List[str]] = []
    local_certificates: Optional[List[str]] = []
    local_education: Optional[List[str]] = []

class Client(BaseModel):
    country: Optional[str] = None
    total_feedback: Optional[float] = None
    total_posted_jobs: Optional[int] = None
    total_hires: Optional[int] = None
    verification_status: Optional[str] = None
    total_reviews: Optional[int] = None

class Job(BaseModel):
    title: Optional[str] = None
    id: Optional[str] = None
    ciphertext: Optional[str] = None
    url: Optional[str] = None
    snippet: Optional[str] = None
    skills: Optional[List[str]] = []
    date_created: Optional[str] = None
    category2: Optional[str] = None
    subcategory2: Optional[str] = None
    job_type: Optional[str] = None
    rate_display: Optional[str] = None
    workload: Optional[str] = None
    duration: Optional[str] = None
    client: Client

class AnalysisRequest(BaseModel):
    job: Job
    profile: dict

# --- FastAPI App ---
app = FastAPI(title="Upwork Opportunity Matcher Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Authentication Routes ---
@app.get("/login", tags=["Authentication"])
async def login_via_upwork():
    params = {
        "client_id": UPWORK_CLIENT_ID,
        "redirect_uri": UPWORK_REDIRECT_URI,
        "response_type": "code"
    }
    authorization_url = f"{UPWORK_OAUTH_BASE_URL}?{urllib.parse.urlencode(params)}"
    logger.info(f"Redirecting user to Upwork for authorization: {authorization_url}")
    return RedirectResponse(url=authorization_url)

@app.get("/oauth/callback", tags=["Authentication"])
async def oauth_callback(request: Request, code: str = Query(...), state: str = Query(None)):
    logger.info(f"Received callback from Upwork with code: {code}")
    token_data = {
        "grant_type": "authorization_code", "code": code, "redirect_uri": UPWORK_REDIRECT_URI,
        "client_id": UPWORK_CLIENT_ID, "client_secret": UPWORK_CLIENT_SECRET,
    }
    headers = { 'User-Agent': 'Mozilla/5.0' }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(UPWORK_TOKEN_ENDPOINT, data=token_data, headers=headers)
            response.raise_for_status()
            tokens = response.json()
            access_token = tokens.get('access_token')
            refresh_token = tokens.get('refresh_token')
            if not access_token:
                raise Exception("Access token not found in response from Upwork.")
            logger.info("Successfully obtained access and refresh tokens.")
            if not os.path.exists(DOTENV_PATH):
                open(DOTENV_PATH, 'a').close()
            set_key(DOTENV_PATH, "UPWORK_ACCESS_TOKEN", access_token)
            set_key(DOTENV_PATH, "UPWORK_REFRESH_TOKEN", refresh_token or "")
            logger.info(f"Tokens saved to {DOTENV_PATH}")
            load_dotenv(dotenv_path=DOTENV_PATH, override=True)
            return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?auth_status=success&refresh=true")
    except httpx.HTTPStatusError as e:
        error_details = e.response.text
        logger.error(f"HTTP error obtaining tokens: {e.response.status_code}", exc_info=True)
        message = f"HTTP_Error_{e.response.status_code}"
        if "Cloudflare" in error_details:
            message += "_Cloudflare_Blocked"
        return RedirectResponse(url=f"{FRONTEND_URL}?auth_status=error&message={message}")
    except Exception as e:
        logger.error(f"Generic error obtaining tokens: {e}", exc_info=True)
        return RedirectResponse(url=f"{FRONTEND_URL}?auth_status=error&message=Failed_to_get_tokens")

@app.get("/auth/status", tags=["Authentication"])
async def get_auth_status():
    load_dotenv(dotenv_path=DOTENV_PATH, override=True)
    access_token = os.getenv("UPWORK_ACCESS_TOKEN")
    if not access_token:
        return {"authenticated": False, "message": "No token found."}
    is_valid = await upwork_api.check_upwork_auth_validity()
    if not is_valid:
        logger.warning("Auth status check: Tokens found but API validity check failed. Clearing stale tokens.")
        if os.path.exists(DOTENV_PATH):
            set_key(DOTENV_PATH, "UPWORK_ACCESS_TOKEN", "")
            set_key(DOTENV_PATH, "UPWORK_REFRESH_TOKEN", "")
        load_dotenv(dotenv_path=DOTENV_PATH, override=True)
        return {"authenticated": False, "message": "Tokens were invalid and have been cleared."}
    return {"authenticated": True}

# --- API Endpoints ---
@app.post("/jobs/analyze", tags=["Analysis"])
async def analyze_job(request: AnalysisRequest):
    logger.info(f"Received request to analyze job: {request.job.title}")
    try:
        analysis_result = await gemini_api.get_job_analysis(
            job_data=request.job.dict(),
            profile_data=request.profile
        )
        return JSONResponse(content=analysis_result)
    except (ValueError, ConnectionError) as e:
        logger.error(f"Error during job analysis for '{job.title}': {e}", exc_info=True)
        # Use a 424 Failed Dependency status code for AI service failures
        raise HTTPException(status_code=424, detail=str(e))
    except HTTPException as e:
        raise e # Re-raise other HTTPExceptions to keep their original status code
    except Exception as e:
        logger.error(f"An unexpected error occurred during analysis for '{job.title}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred.")

@app.get("/filters/categories", tags=["Filters"])
async def get_categories():
    try:
        categories = await upwork_api.fetch_upwork_categories()
        return JSONResponse(content=categories)
    except Exception as e:
        logger.error(f"Error fetching categories: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch categories.")

@app.post("/jobs/fetch", tags=["Jobs"])
async def fetch_jobs(search_request: JobSearchRequest):
    try:
        jobs_data = await upwork_api.search_upwork_jobs_gql(
            query=search_request.query,
            category_ids=search_request.category_ids,
            first=search_request.first,
            after=search_request.after
        )
        return JSONResponse(content=jobs_data)
    except Exception as e:
        logger.error(f"Error fetching jobs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch jobs.")

@app.get("/profile", tags=["Profile"])
async def get_profile():
    profile_key = os.getenv("UPWORK_PROFILE_KEY")
    if not profile_key:
        raise HTTPException(status_code=500, detail="Profile key not configured in backend.")
    try:
        profile_data = await upwork_api.get_freelancer_profile(profile_key=profile_key)
        if profile_data is None:
            raise HTTPException(status_code=404, detail="Freelancer profile not found.")
        return JSONResponse(content=profile_data)
    except Exception as e:
        logger.error(f"Error fetching profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch profile.")

@app.get("/local-profile", tags=["Profile"])
async def get_local_profile():
    try:
        profile_data = local_profile_storage.read_local_profile()
        return JSONResponse(content=profile_data)
    except Exception as e:
        logger.error(f"Error reading local profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not read local profile data.")

@app.post("/local-profile", tags=["Profile"])
async def update_local_profile(profile_data: LocalProfileData):
    try:
        local_profile_storage.write_local_profile(profile_data.dict())
        return {"status": "success", "message": "Local profile updated successfully."}
    except Exception as e:
        logger.error(f"Error writing local profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not write local profile data.")

# --- Health Check ---
@app.get("/healthz", tags=["System"])
async def health_check():
    return {"status": "ok"}
