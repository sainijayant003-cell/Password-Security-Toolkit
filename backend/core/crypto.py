"""
SecurePass - Cryptographic Core Wrapper
Bridges pass_manager_working.py with enterprise service architecture
"""

import os
import sys
import time

from backend.config import (
    BASE_DIR,
    DEFAULT_VAULT_PATH,
    PBKDF2_ALGORITHM,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    STORAGE_NAME
)

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import pass_manager_working as toolkit


class CryptoManager:
    """Manages the lifecycle of encrypted vault storage and active keys in memory."""
    
    def __init__(self, data_file=None):
        self.pm = toolkit.PasswordManager()
        self.pm.data_file = data_file or DEFAULT_VAULT_PATH

    @property
    def is_unlocked(self):
        return getattr(self.pm, 'is_unlocked', False)

    def vault_exists(self):
        return os.path.exists(self.pm.data_file)

    def get_cipher_info(self):
        return {
            "algorithm": PBKDF2_ALGORITHM,
            "iterations": PBKDF2_ITERATIONS,
            "key_length": KEY_LENGTH,
            "storage_path": STORAGE_NAME
        }

    def create_vault(self, master_password, confirm_password):
        if not master_password or not confirm_password:
            return False, "Master password and confirmation are required."
        if master_password != confirm_password:
            return False, "Passwords do not match."
        if len(master_password) < 8:
            return False, "Master password must be at least 8 characters."

        saved = self.pm.create_vault(master_password)
        if saved:
            return True, "Vault initialized with 100,000 PBKDF2 iterations."
        return False, "Failed to write encrypted vault to disk."

    def unlock_vault(self, master_password):
        if not master_password:
            return False, "Master password is required."
        if not self.vault_exists():
            return False, "No vault found. Please initialize a new master vault first."

        success = self.pm.unlock(master_password)
        if success:
            total = sum(len(entries) for entries in self.pm.passwords.values())
            return True, total
        return False, "Invalid master password or corrupted vault file."

    def lock_vault(self):
        self.pm.is_unlocked = False
        self.pm.master_password = None
        self.pm.passwords = {}
        return True

    def get_passwords(self, search_query="", category="all"):
        if not self.is_unlocked:
            return False, "Vault is locked."

        results = []
        q = (search_query or "").strip().lower()
        cat = (category or "all").strip().lower()

        for service, entries in self.pm.passwords.items():
            for idx, entry in enumerate(entries):
                entry_cat = entry.get("category", "General")
                username = entry.get("username", "")
                pwd = entry.get("password", "")

                # Category filter
                if cat != "all" and entry_cat.lower() != cat:
                    continue

                # Search filter
                if q:
                    matches_service = q in service.lower()
                    matches_user = q in username.lower()
                    matches_cat = q in entry_cat.lower()
                    if not (matches_service or matches_user or matches_cat):
                        continue

                # Strength calculation
                entropy = round(toolkit.calculate_entropy(pwd), 2)
                analysis = toolkit.analyze_password(pwd)
                entry_id = entry.get("id") or f"{service}_{idx}"

                results.append({
                    "id": entry_id,
                    "service": service,
                    "username": username,
                    "password": pwd,
                    "category": entry_cat,
                    "notes": entry.get("notes", ""),
                    "entropy_bits": entropy,
                    "strength_score": analysis["score"],
                    "strength_tier": self._calculate_tier(analysis["score"])
                })

        return True, results

    def add_or_update_password(self, service, username, password, category="General", entry_id=None):
        if not self.is_unlocked:
            return False, "Vault is locked."

        service = (service or "").strip()
        username = (username or "").strip()
        password = (password or "").strip()
        category = (category or "General").strip()

        if not service or not username or not password:
            return False, "Service, username, and password are required."

        if service not in self.pm.passwords:
            self.pm.passwords[service] = []

        now_str = time.strftime("%Y-%m-%d %H:%M:%S")

        # Edit existing if entry_id matches
        if entry_id:
            found = False
            for svc_name, entries in self.pm.passwords.items():
                for item in entries:
                    if item.get("id") == entry_id:
                        item["service"] = service
                        item["username"] = username
                        item["password"] = password
                        item["category"] = category
                        item["updated_at"] = now_str
                        found = True
                        break
                if found:
                    break

            if found:
                self.pm._save()
                return True, "Credential successfully updated."

        # Otherwise add new
        new_entry = {
            "id": f"sec_{int(time.time() * 1000)}",
            "service": service,
            "username": username,
            "password": password,
            "category": category,
            "created_at": now_str
        }
        self.pm.passwords[service].append(new_entry)
        saved = self.pm._save()
        if saved:
            return True, "Credential secured in vault."
        return False, "Failed to save encrypted vault."

    def delete_password(self, entry_id):
        if not self.is_unlocked:
            return False, "Vault is locked."

        deleted = False
        for service, entries in list(self.pm.passwords.items()):
            for idx, item in enumerate(entries):
                if item.get("id") == entry_id or f"{service}_{idx}" == entry_id:
                    entries.remove(item)
                    deleted = True
                    break
            if not entries:
                del self.pm.passwords[service]
            if deleted:
                break

        if deleted:
            self.pm._save()
            return True, "Credential removed from vault."
        return False, "Target credential not found."

    def export_backup(self):
        if not self.is_unlocked:
            return False, "Vault is locked."

        timestamp = time.strftime("%Y%m%d_%H%M%S")
        export_payload = {
            "metadata": {
                "format": "SecurePass Vault Export",
                "version": "2.0",
                "exported_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
                "total_entries": sum(len(e) for e in self.pm.passwords.values()),
                "total_records": sum(len(e) for e in self.pm.passwords.values())
            },
            "vault": self.pm.passwords
        }

        return True, {
            "filename": f"securepass_vault_backup_{timestamp}.json",
            "data": export_payload,
            "export": export_payload["metadata"]
        }

    @staticmethod
    def _calculate_tier(score):
        if score >= 80:
            return "Cryptographic Strong"
        if score >= 50:
            return "Moderate Defense"
        return "Vulnerable"


# Shared Global Instance
crypto_manager = CryptoManager()
