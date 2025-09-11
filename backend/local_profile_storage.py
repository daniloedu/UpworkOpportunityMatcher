import os
import json
import logging
from . import encryption

logger = logging.getLogger(__name__)

# Define the path for the encrypted local profile data file
STORAGE_DIR = os.path.dirname(__file__)
LOCAL_PROFILE_PATH = os.path.join(STORAGE_DIR, "user_profile.json.encrypted")

def get_default_profile():
    """Returns the default structure for the local profile."""
    return {
        "location": "",
        "additional_details": "",
        "local_skills": [],
        "local_certificates": [],
        "local_education": [],
        "api_config": {
            "provider": "google",
            "google_api_key": "",
            "aws_access_key_id": "",
            "aws_secret_access_key": "",
            "aws_region": "us-west-2"
        }
    }

def read_local_profile() -> dict:
    """
    Reads and decrypts the local profile data from the file.
    If the file doesn't exist, returns a default profile structure.
    """
    if not os.path.exists(LOCAL_PROFILE_PATH):
        logger.warning(f"Local profile data file not found at {LOCAL_PROFILE_PATH}. Returning default profile.")
        return get_default_profile()

    try:
        with open(LOCAL_PROFILE_PATH, "rb") as f:
            encrypted_data = f.read()
        
        if not encrypted_data:
            logger.warning("Local profile data file is empty. Returning default profile.")
            return get_default_profile()

        decrypted_data_bytes = encryption.decrypt_data(encrypted_data)
        profile_data = json.loads(decrypted_data_bytes.decode('utf-8'))
        logger.info("Successfully read and decrypted local profile data.")
        return profile_data
    except Exception as e:
        logger.error(f"Failed to read or decrypt local profile data from {LOCAL_PROFILE_PATH}: {e}", exc_info=True)
        # If there's any error (e.g., decryption fails), return a default profile
        # to prevent the app from crashing.
        return get_default_profile()

def write_local_profile(data: dict):
    """
    Encrypts and writes the local profile data to the file.
    """
    try:
        # Ensure the data is in JSON format (string)
        data_bytes = json.dumps(data, indent=2).encode('utf-8')
        encrypted_data = encryption.encrypt_data(data_bytes)

        with open(LOCAL_PROFILE_PATH, "wb") as f:
            f.write(encrypted_data)
        
        logger.info(f"Successfully encrypted and wrote local profile data to {LOCAL_PROFILE_PATH}.")
    except Exception as e:
        logger.error(f"Failed to write or encrypt local profile data to {LOCAL_PROFILE_PATH}: {e}", exc_info=True)
        raise
