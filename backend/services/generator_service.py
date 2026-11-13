"""
SecurePass - CSPRNG Key & Multi-Word Password Generator Service
"""

import string
import secrets
import sys
from backend.config import BASE_DIR
from backend.services.analyzer_service import AnalyzerService

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import pass_manager_working as toolkit


class GeneratorService:
    WORDLIST = [
        "kinetic", "quantum", "vertex", "cipher", "beacon", "aurora",
        "cobalt", "glacier", "zenith", "vector", "pulsar", "nexus",
        "stratum", "crypto", "shield", "orbit", "prism", "helix",
        "solaris", "shadow", "ironclad", "matrix", "falcon", "titan",
        "sentinel", "obsidian", "vortex", "starlight", "ember", "bastion"
    ]

    @classmethod
    def generate(cls, mode="password", length=20, count=1,
                 include_upper=True, include_lower=True,
                 include_numbers=True, include_symbols=True,
                 exclude_ambiguous=False, word_count=4,
                 separator="-", include_numbers_in_phrase=True,
                 capitalize=True):
        length = max(8, min(64, int(length)))
        count = max(1, min(10, int(count)))
        results = []

        if mode in ("passphrase", "multiword", "multiword_password"):
            word_count = max(3, min(8, int(word_count)))
            for _ in range(count):
                chosen_words = [secrets.choice(cls.WORDLIST) for _ in range(word_count)]
                if capitalize:
                    chosen_words = [w.capitalize() for w in chosen_words]
                phrase = separator.join(chosen_words)
                if include_numbers_in_phrase:
                    phrase += f"{separator}{secrets.randbelow(900) + 100}"

                entropy = round(toolkit.calculate_entropy(phrase), 2)
                analysis = toolkit.analyze_password(phrase)
                tier = "Cryptographic Strong" if analysis["score"] >= 80 else ("Moderate Defense" if analysis["score"] >= 50 else "Vulnerable")

                results.append({
                    "password": phrase,
                    "entropy": entropy,
                    "score": analysis["score"],
                    "tier": tier,
                    "crack_time": AnalyzerService.calculate_crack_time_matrix(entropy)["offline_gpu"]
                })
        else:
            # Cryptographic character generation
            lower_chars = string.ascii_lowercase
            upper_chars = string.ascii_uppercase
            digit_chars = string.digits
            symbol_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"

            if exclude_ambiguous:
                ambiguous = set("0Oo1lI|`'\"")
                lower_chars = "".join(c for c in lower_chars if c not in ambiguous)
                upper_chars = "".join(c for c in upper_chars if c not in ambiguous)
                digit_chars = "".join(c for c in digit_chars if c not in ambiguous)
                symbol_chars = "".join(c for c in symbol_chars if c not in ambiguous)

            charset = ""
            guaranteed = []
            if include_lower:
                charset += lower_chars
                guaranteed.append(secrets.choice(lower_chars))
            if include_upper:
                charset += upper_chars
                guaranteed.append(secrets.choice(upper_chars))
            if include_numbers:
                charset += digit_chars
                guaranteed.append(secrets.choice(digit_chars))
            if include_symbols:
                charset += symbol_chars
                guaranteed.append(secrets.choice(symbol_chars))

            if not charset:
                charset = lower_chars + upper_chars + digit_chars
                guaranteed = [secrets.choice(charset)]

            for _ in range(count):
                pwd_chars = list(guaranteed)
                rem = max(0, length - len(pwd_chars))
                pwd_chars += [secrets.choice(charset) for _ in range(rem)]

                # Cryptographic Fisher-Yates shuffle
                for i in range(len(pwd_chars) - 1, 0, -1):
                    j = secrets.randbelow(i + 1)
                    pwd_chars[i], pwd_chars[j] = pwd_chars[j], pwd_chars[i]

                pwd = "".join(pwd_chars)
                entropy = round(toolkit.calculate_entropy(pwd), 2)
                analysis = toolkit.analyze_password(pwd)
                tier = "Cryptographic Strong" if analysis["score"] >= 80 else ("Moderate Defense" if analysis["score"] >= 50 else "Vulnerable")

                results.append({
                    "password": pwd,
                    "entropy": entropy,
                    "score": analysis["score"],
                    "tier": tier,
                    "crack_time": AnalyzerService.calculate_crack_time_matrix(entropy)["offline_gpu"]
                })

        return results
