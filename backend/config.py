"""
SecurePass - Configuration & Security Constants
"""

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
DEFAULT_VAULT_PATH = os.path.join(BASE_DIR, "passwords.vault")

# Cryptographic Specifications
PBKDF2_ALGORITHM = "PBKDF2-HMAC-SHA256"
PBKDF2_ITERATIONS = 100000
KEY_LENGTH = "256-bit"
STORAGE_NAME = "passwords.vault (Local Encrypted)"

# Default Server Port
DEFAULT_PORT = 5055
