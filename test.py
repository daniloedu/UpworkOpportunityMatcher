import socket
_original_getaddrinfo = socket.getaddrinfo
def _getaddrinfo_ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
    return _original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _getaddrinfo_ipv4_only

# test.py
import asyncio
import json
import os
import sys
import logging
from dotenv import load_dotenv

# --- Setup logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Add project root to Python path ---
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend import gemini_api

async def run_simplified_test():
    """Runs a fully isolated test of the Gemini API call with fake data."""
    logging.info("--- Starting Simplified Gemini API Test Script ---")

    # 1. Define Fake Job Data
    fake_job = {
        "title": "Experienced Operations Manager Needed for Streamlined Business Processes",
        "snippet": "We are seeking a highly organized and proactive Operations Manager to oversee and optimize our daily business operations. The ideal candidate will have a strong background in process improvement, team management, and strategic planning.",
        "skills": ["Operations Management", "Process Improvement", "Budgeting", "Team Leadership"],
        "job_type": "HOURLY",
        "rate_display": "$40.00 - $70.00 /hr"
    }
    logging.info("Step 1: Using sample job data.")

    # 2. Define Fake Profile Data
    fake_profile = {
        "upwork_profile": {
            "fullName": "Danilo Salazar",
            "personalData": {
                "title": "Senior Project Manager & AI Consultant",
                "description": "A seasoned project manager with over 10 years of experience leading complex, cross-functional projects. Specialized in Agile methodologies and AI-driven product development."
            },
            "skills": {
                "edges": [
                    {"node": {"id": "Project Management"}},
                    {"node": {"id": "Agile Methodology"}},
                    {"node": {"id": "AI Strategy"}},
                    {"node": {"id": "Scrum"}}
                ]
            }
        },
        "local_additions": {
            "location": "San Francisco, CA",
            "additional_details": "Passionate about leveraging technology to improve business operations.",
            "local_skills": ["Process Improvement", "Budgeting", "Team Leadership"],
            "local_certificates": ["PMP Certified - 2021"],
            "local_education": ["MBA - Stanford University - 2015"]
        }
    }
    logging.info("Step 2: Using fake profile data.")

    try:
        # 3. Call the analysis function
        logging.info("Step 3: Calling Gemini API for analysis. This may take a moment...")
        analysis = await gemini_api.get_job_analysis(fake_job, fake_profile)
        
        logging.info("--- Gemini Analysis Result ---")
        print(json.dumps(analysis, indent=2))
        logging.info("-----------------------------")

    except Exception as e:
        logging.error("--- An Error Occurred During the Test ---", exc_info=True)

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(run_simplified_test())