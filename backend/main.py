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
from . import upwork_api, local_profile_storage, gemini_api, bulk_analyzer, bedrock_api

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
class ApiConfig(BaseModel):
    provider: str
    google_api_key: Optional[str] = None
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: Optional[str] = "us-west-2"

class JobSearchRequest(BaseModel):
    query: Optional[str] = None
    category_ids: Optional[List[str]] = None
    location: Optional[str] = None
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

class BulkAnalysisRequest(BaseModel):
    jobs: List[Job]
    profile: dict

class ProposalGenerationRequest(BaseModel):
    job: Job
    profile: dict
    analysis: dict

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
@app.post("/jobs/analyze-all", tags=["Analysis"])
async def analyze_all_jobs(request: BulkAnalysisRequest):
    logger.info(f"Received request to analyze {len(request.jobs)} jobs.")
    try:
        local_profile = local_profile_storage.read_local_profile()
        api_config = local_profile.get("api_config", {"provider": "google"})

        analysis_results = await bulk_analyzer.analyze_multiple_jobs(
            jobs=[job.dict() for job in request.jobs],
            profile_data=request.profile,
            api_config=api_config
        )
        return JSONResponse(content=analysis_results)
    except Exception as e:
        logger.error(f"An unexpected error occurred during bulk analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred during bulk analysis.")

@app.post("/jobs/analyze", tags=["Analysis"])
async def analyze_job(request: AnalysisRequest):
    logger.info(f"Received request to analyze job: {request.job.title}")
    try:
        # Read the full local profile to get the API config
        local_profile = local_profile_storage.read_local_profile()
        # Get the api_config, or use a default if it doesn't exist.
        api_config = local_profile.get("api_config", {"provider": "google"})

        if not api_config or "provider" not in api_config:
            # This case should ideally not be reached due to the default above, but as a safeguard:
            api_config = {"provider": "google"}

        provider = api_config.get("provider", "google")
        logger.info(f"Using AI provider: {provider}")

        if provider == "google":
            analysis_result = await gemini_api.get_job_analysis(
                job_data=request.job.dict(),
                profile_data=request.profile
            )
        elif provider == "aws":
            analysis_result = await bedrock_api.get_job_analysis(
                job_data=request.job.dict(),
                profile_data=request.profile,
                api_config=api_config
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported AI provider: {provider}")

        return JSONResponse(content=analysis_result)
    except (ValueError, ConnectionError) as e:
        logger.error(f"Error during job analysis for '{request.job.title}': {e}", exc_info=True)
        raise HTTPException(status_code=424, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"An unexpected error occurred during analysis for '{request.job.title}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred.")


@app.post("/proposals/generate", tags=["Proposals"])
async def generate_proposal_endpoint(request: ProposalGenerationRequest):
    logger.info(f"Received request to generate proposal for job: {request.job.title}")
    try:
        local_profile = local_profile_storage.read_local_profile()
        api_config = local_profile.get("api_config", {"provider": "google"})
        provider = api_config.get("provider", "google")
        logger.info(f"Using AI provider: {provider} for proposal generation")

        if provider == "google":
            proposal_text = await gemini_api.generate_proposal(
                job_data=request.job.dict(),
                profile_data=request.profile,
                analysis_data=request.analysis
            )
        elif provider == "aws":
            proposal_text = await bedrock_api.generate_proposal(
                job_data=request.job.dict(),
                profile_data=request.profile,
                analysis_data=request.analysis,
                api_config=api_config
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported AI provider: {provider}")

        return JSONResponse(content={"proposal_text": proposal_text})
    except (ValueError, ConnectionError) as e:
        logger.error(f"Error during proposal generation for '{request.job.title}': {e}", exc_info=True)
        raise HTTPException(status_code=424, detail=str(e))
    except Exception as e:
        logger.error(f"An unexpected error occurred during proposal generation for '{request.job.title}': {e}", exc_info=True)
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
            location=search_request.location,
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
        # Read the existing profile to preserve the api_config
        existing_profile = local_profile_storage.read_local_profile()
        api_config = existing_profile.get("api_config", local_profile_storage.get_default_profile()["api_config"])

        # Create the new profile data, combining the updated fields with the existing api_config
        new_profile_data = profile_data.dict()
        new_profile_data["api_config"] = api_config

        local_profile_storage.write_local_profile(new_profile_data)
        return {"status": "success", "message": "Local profile updated successfully."}
    except Exception as e:
        logger.error(f"Error writing local profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not write local profile data.")

# --- Config Endpoints ---
@app.get("/api/config", tags=["Configuration"])
async def get_api_config():
    try:
        profile_data = local_profile_storage.read_local_profile()
        api_config = profile_data.get("api_config", local_profile_storage.get_default_profile()["api_config"])
        return JSONResponse(content=api_config)
    except Exception as e:
        logger.error(f"Error reading API config: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not read API config.")

@app.post("/api/config", tags=["Configuration"])
async def update_api_config(api_config: ApiConfig):
    try:
        # Read the existing profile
        existing_profile = local_profile_storage.read_local_profile()
        
        # Update the api_config part of the profile
        existing_profile["api_config"] = api_config.dict()
        
        # Write the entire profile back
        local_profile_storage.write_local_profile(existing_profile)
        
        return {"status": "success", "message": "API configuration updated successfully."}
    except Exception as e:
        logger.error(f"Error writing API config: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not write API config.")


# --- Health Check ---
@app.get("/healthz", tags=["System"])
async def health_check():
    return {"status": "ok"}
