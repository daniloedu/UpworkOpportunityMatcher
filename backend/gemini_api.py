# backend/gemini_api.py
import os
import json
import logging
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from dotenv import load_dotenv
from . import prompts

# --- Configuration & Setup ---
DOTENV_PATH = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=DOTENV_PATH)

logger = logging.getLogger(__name__)

GOOGLE_API = os.getenv("GOOGLE_API")

if not GOOGLE_API:
    logger.error("FATAL: GOOGLE_API not found in .env file.")
    raise ValueError("GOOGLE_API is not set in the environment.")

genai.configure(api_key=GOOGLE_API)

async def get_job_analysis(job_data: dict, profile_data: dict) -> dict:
    """
    Analyzes a job posting against a freelancer's profile using the Gemini API.
    """
    logger.info(f"Starting Gemini analysis for job: {job_data.get('title')}")

    try:
        prompt_text = prompts.JOB_ANALYSIS_PROMPT.format(
            job_data=json.dumps(job_data, indent=2),
            profile_data=json.dumps(profile_data, indent=2)
        )

        model = genai.GenerativeModel('gemini-2.5-flash')

        generation_config = genai.types.GenerationConfig(response_mime_type="application/json")

        response = await model.generate_content_async(
            prompt_text,
            generation_config=generation_config,
            request_options={'timeout': 120}
        )

        analysis_json = json.loads(response.text)
        logger.info(f"Successfully parsed Gemini analysis for job: {job_data.get('title')}")
        
        return analysis_json

    except (google_exceptions.GoogleAPICallError, google_exceptions.RetryError) as e:
        logger.error(f"Google API call failed: {e}", exc_info=True)
        raise ConnectionError(f"Communication error with Google AI: {e}")
    except json.JSONDecodeError as e:
        response_text = getattr(response, 'text', 'N/A')
        logger.error(f"JSON parsing failed for Gemini response: {e}")
        logger.error(f"Response text that failed parsing: {response_text}")
        raise ValueError("Failed to parse the analysis from the AI response.")
    except Exception as e:
        logger.error(f"An unexpected error occurred during Gemini API call: {e}", exc_info=True)
        raise ConnectionError("An unexpected error occurred while analyzing the job.")

async def generate_proposal(job_data: dict, profile_data: dict, analysis_data: dict) -> str:
    """
    Generates a cover letter for a job application using the Gemini API.
    """
    logger.info(f"Starting proposal generation for job: {job_data.get('title')}")

    try:
        prompt_text = prompts.PROPOSAL_GENERATION_PROMPT.format(
            job_data=json.dumps(job_data, indent=2),
            profile_data=json.dumps(profile_data, indent=2),
            analysis_data=json.dumps(analysis_data, indent=2)
        )

        model = genai.GenerativeModel('gemini-2.5-flash')

        response = await model.generate_content_async(
            prompt_text,
            request_options={'timeout': 180}
        )

        proposal_text = response.text
        logger.info(f"Successfully generated proposal for job: {job_data.get('title')}")
        
        return proposal_text

    except (google_exceptions.GoogleAPICallError, google_exceptions.RetryError) as e:
        logger.error(f"Google API call failed during proposal generation: {e}", exc_info=True)
        raise ConnectionError(f"Communication error with Google AI during proposal generation: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred during proposal generation: {e}", exc_info=True)
        raise ConnectionError("An unexpected error occurred while generating the proposal.")
