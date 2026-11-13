# 🛡️ SecurePass - Enterprise Password Security & Vault Suite

A professional, high-performance password management and cryptographic analysis platform. Built with a **modular Python service layer (PBKDF2-HMAC-SHA256 / AES-256)** and an **Unslop-designed, craft-oriented reactive frontend featuring centralized state management**.

---

## 👨‍💻 Author
**Gaurav Yadav**

---

## 🎨 Unslop Design System Integration

Following the principles of [heydamir/unslop](https://github.com/heydamir/unslop), this interface transforms generic, AI-generated "vibecoded" tropes into an intentional, high-craft utility interface:
- **Zero AI Slop**: Removed fake neon glowing card halos, pulsing animated loops, rainbow border strips, and shouty marketing hyperbole.
- **Tuned Neutral Ramps**: Deep matte Zinc/Obsidian surfaces (`#09090b`, `#141417`, `#1a1a1f`) paired with hairline borders (`rgba(255, 255, 255, 0.07)` to `0.12`).
- **Tactile Depth**: Replaced blurry outer glows with crisp 1px inset highlights (`inset 0 1px 0 rgba(255,255,255,0.05)`) and realistic micro-shadows.
- **Strict 8px Grid & Spacing**: Calibrated padding and high information density across credential rows and telemetry cards.
- **Intentional Typography**: Clean Inter & JetBrains Mono typography with tabular figures (`tnum`) for exact alignment of entropy, numbers, and secrets.
- **Calibrated Themes**: Includes **Unslop Studio** (flagship Zinc minimalist studio palette), **Graphite Slate**, **Terminal Emerald**, **Midnight Navy**, **Onyx Crimson**, and **Industrial Amber**.
- **Quiet Background Textures**: Replaced distracting fast matrix rain and laser meshes with calm, studio-grade backdrops (**Studio Grid**, **Minimal Matte**, **Subtle Network**, and **Quiet Telemetry**).
- **Direct Terminology**: Fully unified around standard **password** terminology (no clunky "passphrase" wording).

---

## 🏗️ Architecture & Clean Design Principles

### 1. Centralized Reactive State Store (`frontend/js/core/store.js`)
- **Single Source of Truth**: Unified state container holding `auth`, `vault`, `theme`, `background`, `analyzer`, `generator`, `audit`, and `ui` slices.
- **Unidirectional Data Flow**: State mutations occur via explicit actions (`Store.dispatch(action, payload)` or `Store.setState(slice, payload)`).
- **Pub/Sub Subscriptions**: Decoupled components subscribe directly to state slices (`Store.subscribe(slice, callback)`), eliminating tangled DOM queries and race conditions.
- **Persistent Preferences**: Synchronizes theme and visual preferences with `localStorage`.

### 2. Separated Business Logic (Backend Service Layer)
- **`backend/core/crypto.py`**: Thread-safe wrapper handling PBKDF2-HMAC-SHA256 key derivation, AES stream encryption, and vault file I/O.
- **`backend/services/analyzer_service.py`**: Pure cryptanalysis routines for Shannon entropy ($H = L \cdot \log_2(N)$), search space calculation, and 4-tier adversary brute-force simulations.
- **`backend/services/generator_service.py`**: CSPRNG string generation and Diceware multi-word password algorithms.
- **`backend/services/audit_service.py`**: Security health mathematical formula, password reuse detection, and risk categorization.
- **`backend/routes/`**: Clean Flask Blueprints (`vault_bp`, `security_bp`) separating HTTP validation from domain logic.

### 3. Layered CSS Architecture (`frontend/css/`)
- **`base.css`**: Typography (Inter + JetBrains Mono), resets, custom scrollbars, and canvas overlay.
- **`themes.css`**: 6 calibrated studio themes with custom CSS variables and refined contrast.
- **`layout.css`**: Dedicated authentication portal view, left sidebar navigation, top bar, and responsive grids.
- **`components.css`**: Reusable cards, credentials table, badges, checklist chips, modals, and toast alerts.
- **`main.css`**: Master stylesheet cleanly importing all architectural layers.

---

## 📁 Repository Structure

```
Password-Security-Toolkit-main/
│
├── backend/                        # Modular backend services & API routes
│   ├── __init__.py                 # Flask application factory (create_app)
│   ├── config.py                   # Global constants, paths, and security specs
│   ├── core/
│   │   └── crypto.py               # Cryptographic core & PBKDF2 vault wrapper
│   ├── services/
│   │   ├── analyzer_service.py     # Shannon entropy & adversary crack matrix
│   │   ├── generator_service.py    # CSPRNG key & Diceware password generator
│   │   └── audit_service.py        # Posture scoring & password reuse algorithm
│   └── routes/
│       ├── vault_routes.py         # Vault lifecycle & credential CRUD endpoints
│       └── security_routes.py      # Analysis, generation, and audit endpoints
│
├── frontend/                       # Decoupled reactive frontend
│   ├── index.html                  # Semantic authentication portal & dashboard
│   ├── css/
│   │   ├── base.css                # Resets, typography, scrollbars, canvas
│   │   ├── themes.css              # 6 Unslop studio themes
│   │   ├── layout.css              # Login portal & left-sidebar layout
│   │   ├── components.css          # Tables, cards, modals, chips, toasts
│   │   └── main.css                # Master bundle stylesheet
│   └── js/
│       ├── core/
│       │   ├── store.js            # Centralized Reactive State Store (Pub/Sub)
│       │   ├── api.js              # REST client interfacing with backend
│       │   └── ui.js               # Modal manager, toasts, clipboard auto-scrub
│       ├── components/
│       │   ├── theme.js            # Theme manager (syncs with Store & storage)
│       │   ├── background.js       # Dynamic canvas (Grid, Minimal, Network, Telemetry)
│       │   └── sidebar.js          # Sidebar navigation & telemetry badges
│       ├── modules/
│       │   ├── auth.js             # Dedicated zero-knowledge login portal
│       │   ├── vault.js            # Masked credentials table & CRUD actions
│       │   ├── analyzer.js         # Real-time entropy & adversary crack matrix
│       │   ├── generator.js        # CSPRNG string & Diceware password UI
│       │   └── audit.js            # Security posture audit & reuse telemetry
│       └── app.js                  # Main bootstrap orchestrator
│
├── app.py                          # Clean web server entrypoint
├── pass_manager_working.py         # PBKDF2/XOR cipher cryptographic foundation
├── run_frontend.bat                # One-click Windows launcher
└── requirements.txt                # Python dependencies (Flask)
```

---

## 🚀 Quick Start

Double-click `run_frontend.bat` or run:
```bash
python app.py
```
Open **`http://localhost:5055`** in any modern web browser.
