"""
SecurePass - Password Strength & Threat Analysis Service
Shannon entropy calculation, search-space calculation, adversary crack-time matrix
"""

import re
import sys
from backend.config import BASE_DIR

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import pass_manager_working as toolkit


class AnalyzerService:
    @staticmethod
    def calculate_crack_time_matrix(entropy_bits):
        """
        Adversary hash rate estimations:
        - Online throttled: 100 req/min (~1.67 guesses/sec)
        - Online unthrottled / botnet: 10,000 req/sec
        - Offline GPU rig (e.g. 8x RTX 4090 cluster): 100 billion hashes/sec
        - Supercomputer / nation-state: 100 trillion hashes/sec
        """
        if entropy_bits <= 0:
            return {
                "online_throttled": "Instant",
                "online_unthrottled": "Instant",
                "offline_gpu": "Instant",
                "supercomputer": "Instant"
            }

        combos = 2 ** min(128, entropy_bits)

        def format_time(seconds):
            if seconds < 1:
                return "Instant"
            if seconds < 60:
                return f"{int(seconds)} seconds"
            if seconds < 3600:
                return f"{int(seconds / 60)} minutes"
            if seconds < 86400:
                return f"{int(seconds / 3600)} hours"
            if seconds < 31536000:
                return f"{int(seconds / 86400)} days"
            years = seconds / 31536000
            if years < 1000:
                return f"{int(years)} years"
            if years < 1000000:
                return f"{int(years / 1000):,} thousand years"
            if years < 1000000000:
                return f"{int(years / 1000000):,} million years"
            return "Centuries (Cryptographically Secure)"

        return {
            "online_throttled": format_time(combos / 1.67),
            "online_unthrottled": format_time(combos / 10000),
            "offline_gpu": format_time(combos / 1e11),
            "supercomputer": format_time(combos / 1e14)
        }

    @classmethod
    def analyze(cls, password):
        if not password:
            return {
                "score": 0,
                "rating": "Empty",
                "tier": "Awaiting Input",
                "entropy": 0.0,
                "search_space": "0",
                "crack_times": cls.calculate_crack_time_matrix(0),
                "breakdown": {
                    "length": 0,
                    "charset_size": 0,
                    "has_lower": False,
                    "has_upper": False,
                    "has_digits": False,
                    "has_symbols": False
                },
                "issues": ["No password provided for analysis."],
                "good": []
            }

        analysis = toolkit.analyze_password(password)
        entropy = analysis["entropy"]
        score = analysis["score"]

        # Search space calculation
        charset_size = 0
        if re.search(r'[a-z]', password): charset_size += 26
        if re.search(r'[A-Z]', password): charset_size += 26
        if re.search(r'[0-9]', password): charset_size += 10
        if re.search(r'[^a-zA-Z0-9]', password): charset_size += 32

        if charset_size > 0:
            combos = charset_size ** len(password)
            search_space_str = f"{combos:.2e}" if combos > 1e6 else f"{combos:,}"
        else:
            search_space_str = "0"

        # Tier calculation
        if score >= 80:
            tier = "Cryptographic Strong"
        elif score >= 50:
            tier = "Moderate Defense"
        else:
            tier = "Vulnerable"

        breakdown = {
            "length": len(password),
            "charset_size": charset_size,
            "has_lower": bool(re.search(r'[a-z]', password)),
            "has_upper": bool(re.search(r'[A-Z]', password)),
            "has_digits": bool(re.search(r'[0-9]', password)),
            "has_symbols": bool(re.search(r'[^a-zA-Z0-9]', password))
        }

        return {
            "score": score,
            "rating": analysis["rating"],
            "tier": tier,
            "entropy": entropy,
            "search_space": search_space_str,
            "crack_times": cls.calculate_crack_time_matrix(entropy),
            "breakdown": breakdown,
            "issues": analysis.get("issues", []),
            "good": analysis.get("good", [])
        }
