
import os
import sys
import webbrowser
from threading import Timer

# Ensure Windows UTF-8 stdout
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend import create_app
from backend.core.crypto import crypto_manager
from backend.config import DEFAULT_PORT

# Global app and crypto references for testing & execution
app = create_app()
pm = crypto_manager.pm


def open_browser(port):
    try:
        webbrowser.open_new(f"http://127.0.0.1:{port}/")
    except Exception:
        pass


if __name__ == '__main__':
    port = DEFAULT_PORT
    print("\n" + "="*60)
    print("SECUREPASS : Enterprise Security & Vault Management")
    print("="*60)
    print(f"Server operational: http://localhost:{port}")
    print("Status: Cryptographic engine active (PBKDF2-HMAC-SHA256)")
    print("Architecture: Modular Services & Clean Blueprints")
    print("="*60 + "\n")
    Timer(1.2, open_browser, args=[port]).start()
    app.run(host='0.0.0.0', port=port, debug=False)
