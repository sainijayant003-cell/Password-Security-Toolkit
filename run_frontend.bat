@echo off
title SecurePass - Enterprise Password Security & Vault Suite
color 0B
echo ===================================================================
echo     SECUREPASS : ENTERPRISE PASSWORD SECURITY & VAULT SUITE
echo ===================================================================
echo.
echo Initializing cryptographic web interface...
cd /d "%~dp0"
python app.py
pause
