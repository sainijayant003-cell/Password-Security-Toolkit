"""
SecurePass - Enterprise Application Factory
"""

import os
import secrets
from flask import Flask, send_from_directory
from backend.config import FRONTEND_DIR
from backend.routes.vault_routes import vault_bp
from backend.routes.security_routes import security_bp


def create_app():
    """Initializes and returns the Flask application instance."""
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
    app.secret_key = secrets.token_hex(32)

    # Register modular route blueprints
    app.register_blueprint(vault_bp)
    app.register_blueprint(security_bp)

    @app.route("/")
    def serve_index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        return send_from_directory(FRONTEND_DIR, path)

    return app
