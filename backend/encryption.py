import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv
import logging

# Load environment variables
DOTENV_PATH = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=DOTENV_PATH)

logger = logging.getLogger(__name__)

# Get the encryption key from environment variables
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    logger.error("FATAL: ENCRYPTION_KEY not found in .env file.")
    # In a real application, you might want to raise an exception
    # or handle this more gracefully.
    raise ValueError("ENCRYPTION_KEY is not set in the environment.")

# Initialize Fernet cipher suite
_cipher_suite = Fernet(ENCRYPTION_KEY.encode())

def encrypt_data(data: bytes) -> bytes:
    """Encrypts the given data."""
    try:
        return _cipher_suite.encrypt(data)
    except Exception as e:
        logger.error(f"Error encrypting data: {e}", exc_info=True)
        raise

def decrypt_data(encrypted_data: bytes) -> bytes:
    """Decrypts the given data."""
    try:
        return _cipher_suite.decrypt(encrypted_data)
    except Exception as e:
        logger.error(f"Error decrypting data: {e}", exc_info=True)
        raise
