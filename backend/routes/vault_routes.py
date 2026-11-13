"""
SecurePass - Vault API Routes
Status, authentication, credential CRUD, and export endpoints
"""

from flask import Blueprint, request, jsonify
from backend.core.crypto import crypto_manager

vault_bp = Blueprint("vault_bp", __name__)


@vault_bp.route("/api/status", methods=["GET"])
def get_status():
    cipher_info = crypto_manager.get_cipher_info()
    return jsonify({
        "success": True,
        "vault_exists": crypto_manager.vault_exists(),
        "is_unlocked": crypto_manager.is_unlocked,
        "cipher_info": cipher_info
    })


@vault_bp.route("/api/vault/create", methods=["POST"])
def create_vault_endpoint():
    data = request.get_json() or {}
    master = data.get("master_password", "")
    confirm = data.get("confirm_password", "")

    success, message = crypto_manager.create_vault(master, confirm)
    if success:
        return jsonify({"success": True, "message": message})
    return jsonify({"success": False, "error": message}), 400


@vault_bp.route("/api/vault/unlock", methods=["POST"])
def unlock_vault_endpoint():
    data = request.get_json() or {}
    master = data.get("master_password", "")

    success, result = crypto_manager.unlock_vault(master)
    if success:
        return jsonify({
            "success": True,
            "message": "Vault decrypted successfully.",
            "total_credentials": result
        })
    return jsonify({"success": False, "error": result}), 401


@vault_bp.route("/api/vault/lock", methods=["POST"])
def lock_vault_endpoint():
    crypto_manager.lock_vault()
    return jsonify({
        "success": True,
        "message": "Vault memory wiped and locked."
    })


@vault_bp.route("/api/passwords", methods=["GET"])
def get_passwords_endpoint():
    q = request.args.get("q", "")
    category = request.args.get("category", "all")

    success, result = crypto_manager.get_passwords(q, category)
    if success:
        return jsonify({
            "success": True,
            "count": len(result),
            "credentials": result
        })
    return jsonify({"success": False, "error": result}), 403


@vault_bp.route("/api/passwords", methods=["POST"])
def save_password_endpoint():
    data = request.get_json() or {}
    service = data.get("service", "")
    username = data.get("username", "")
    password = data.get("password", "")
    category = data.get("category", "General")
    entry_id = data.get("id", None)

    success, message = crypto_manager.add_or_update_password(
        service, username, password, category, entry_id
    )
    if success:
        return jsonify({"success": True, "message": message})
    return jsonify({"success": False, "error": message}), 400


@vault_bp.route("/api/passwords/delete", methods=["POST"])
def delete_password_endpoint():
    data = request.get_json() or {}
    entry_id = data.get("id", "")

    if not entry_id:
        return jsonify({"success": False, "error": "Credential identifier required."}), 400

    success, message = crypto_manager.delete_password(entry_id)
    if success:
        return jsonify({"success": True, "message": message})
    return jsonify({"success": False, "error": message}), 404


@vault_bp.route("/api/passwords/export", methods=["GET"])
def export_vault_endpoint():
    success, result = crypto_manager.export_backup()
    if success:
        return jsonify({
            "success": True,
            "filename": result["filename"],
            "data": result["data"],
            "export": result["export"]
        })
    return jsonify({"success": False, "error": result}), 403
