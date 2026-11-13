"""
SecurePass - Security & Cryptanalysis Routes
Analyzer, CSPRNG Generator, and Audit endpoints
"""

from flask import Blueprint, request, jsonify
from backend.services.analyzer_service import AnalyzerService
from backend.services.generator_service import GeneratorService
from backend.services.audit_service import AuditService

security_bp = Blueprint("security_bp", __name__)


@security_bp.route("/api/analyze", methods=["POST"])
def analyze_password():
    data = request.get_json() or {}
    password = data.get("password", "")
    result = AnalyzerService.analyze(password)
    return jsonify(result)


@security_bp.route("/api/generate", methods=["POST"])
def generate_passwords():
    data = request.get_json() or {}
    mode = data.get("mode", "password")
    length = data.get("length", 20)
    count = data.get("count", 1)
    include_upper = data.get("include_upper", True)
    include_lower = data.get("include_lower", True)
    include_numbers = data.get("include_numbers", True)
    include_symbols = data.get("include_symbols", True)
    exclude_ambiguous = data.get("exclude_ambiguous", False)
    word_count = data.get("word_count", 4)
    separator = data.get("separator", "-")
    include_numbers_in_phrase = data.get("include_numbers_in_phrase", True)

    results = GeneratorService.generate(
        mode=mode,
        length=length,
        count=count,
        include_upper=include_upper,
        include_lower=include_lower,
        include_numbers=include_numbers,
        include_symbols=include_symbols,
        exclude_ambiguous=exclude_ambiguous,
        word_count=word_count,
        separator=separator,
        include_numbers_in_phrase=include_numbers_in_phrase
    )

    return jsonify({
        "success": True,
        "count": len(results),
        "passwords": results
    })


@security_bp.route("/api/vault/audit", methods=["GET"])
def audit_vault_posture():
    success, result = AuditService.audit_vault()
    if success:
        return jsonify({
            "success": True,
            **result
        })
    return jsonify({"success": False, "error": result}), 403
