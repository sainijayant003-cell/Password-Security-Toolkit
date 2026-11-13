"""
SecurePass - Vault Security Posture & Threat Telemetry Service
Analyzes stored credentials, detects reused secrets, and computes overall posture
"""

import sys
from backend.config import BASE_DIR
from backend.core.crypto import crypto_manager

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import pass_manager_working as toolkit


class AuditService:
    @staticmethod
    def audit_vault():
        if not crypto_manager.is_unlocked:
            return False, "Vault is locked."

        all_entries = []
        password_map = {}  # password -> list of account descriptors
        strong_count = 0
        moderate_count = 0
        weak_count = 0
        compromised_count = 0

        for service, entries in crypto_manager.pm.passwords.items():
            for entry in entries:
                pwd = entry.get("password", "")
                username = entry.get("username", "")
                analysis = toolkit.analyze_password(pwd)
                score = analysis["score"]

                account_id = f"{service} ({username})"
                if pwd not in password_map:
                    password_map[pwd] = []
                password_map[pwd].append(account_id)

                if pwd.lower() in toolkit.COMMON_PASSWORDS:
                    compromised_count += 1
                elif score >= 80:
                    strong_count += 1
                elif score >= 50:
                    moderate_count += 1
                else:
                    weak_count += 1

                all_entries.append({
                    "service": service,
                    "username": username,
                    "category": entry.get("category", "General"),
                    "strength_score": score,
                    "strength_tier": "Cryptographic Strong" if score >= 80 else ("Moderate Defense" if score >= 50 else "Vulnerable")
                })

        total = len(all_entries)

        # Detect reused passwords
        duplicated_groups = []
        reused_passwords_count = 0
        for pwd, accounts in password_map.items():
            if len(accounts) > 1:
                reused_passwords_count += len(accounts)
                duplicated_groups.append({
                    "accounts": accounts,
                    "occurrences": len(accounts)
                })

        # Calculate overall health posture (0-100)
        if total == 0:
            overall_health = 100
        else:
            healthy_ratio = (strong_count * 100 + moderate_count * 50) / (total * 100)
            penalty = (weak_count * 10 + reused_passwords_count * 5 + compromised_count * 20) / total
            overall_health = max(0, min(100, int(healthy_ratio * 100 - penalty)))

        return True, {
            "total_credentials": total,
            "overall_health": overall_health,
            "counts": {
                "strong": strong_count,
                "moderate": moderate_count,
                "weak": weak_count,
                "compromised": compromised_count,
                "reused": reused_passwords_count
            },
            "duplicated_groups": duplicated_groups,
            "credentials": all_entries
        }
