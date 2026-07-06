# Language Translation Tool

A production-ready translation web application featuring a decoupled FastAPI backend and a responsive Vanilla HTML5/CSS3/JavaScript frontend. This project is structured according to clean architecture guidelines to ensure modularity, scalability, and ease of testing.

## Features

- **Decoupled Architecture**: Independent frontend and backend components.
- **FastAPI Backend**: High-performance, asynchronous REST API.
- **Responsive Frontend**: Modern UI built with vanilla HTML5, CSS3, and ES6 JavaScript.
- **Google Cloud Translation Integration**: Integrates directly with the Google Cloud Translation REST API.
- **Environment Configuration**: Structured environment variables for local development and production.

---

## Project Structure

```text
Language Translation Tool/
├── backend/
│   ├── app/
│   │   ├── api/            # API routing, request validation, and endpoint handlers
│   │   ├── core/           # Configuration management and settings validation
│   │   ├── services/       # Core business logic and external integrations (Google Cloud Translation API)
│   │   ├── models/         # Pydantic schemas and serialization models
│   │   ├── utils/          # Auxiliary helper modules and common utilities
│   │   ├── static/         # Static assets served by the backend
│   │   └── templates/      # HTML templates served by the backend
│   ├── main.py             # Application entry point, CORS config, and middleware setup
│   ├── requirements.txt    # Production dependencies
│   └── .env.example        # Reference environment configuration file
├── frontend/
│   ├── css/                # Styling and layout stylesheets
│   ├── js/                 # DOM manipulation and API integration scripts
│   ├── assets/             # Images, icons, and logo resources
│   ├── components/         # Reusable frontend UI components
│   └── index.html          # Main application user interface markup
├── docs/                   # Architectural diagrams and developer documentation
├── screenshots/            # Visual previews of the application
├── tests/                  # Integration and verification test suites
├── .gitignore              # Global git exclude rules
├── LICENSE                 # MIT License details
└── README.md               # Main project documentation
```

---

## Technology Stack

- **Backend**:
  - Python 3.12+
  - FastAPI (Web framework)
  - Uvicorn (ASGI server)
  - HTTPX (Asynchronous HTTP client for API requests)
  - Pydantic v2 (Data validation and configuration management)
  - Python-Dotenv (Environment variable manager)
- **Frontend**:
  - HTML5 (Semantic document markup)
  - CSS3 (Custom properties, grid, and flexbox layout systems)
  - JavaScript (ES6 Modules, asynchronous fetch requests)
- **Integration**:
  - Google Cloud Translation v2 REST API (Machine translation engine)

---

## Getting Started

### Prerequisites
- Python 3.12 or higher installed.
- A Google Cloud Project with the **Cloud Translation API** enabled.
- A valid **API Key** generated from your Google Cloud Console.

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```

4. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure environment variables:
   Copy `.env.example` to `.env` inside the `backend` folder:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and insert your Google Cloud Translation API key:
   ```env
   GOOGLE_TRANSLATE_API_KEY=YOUR_ACTUAL_GOOGLE_API_KEY
   ```
   *Note: Never commit your `.env` file containing the actual API key to version control.*

6. Start the development server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend API will run at `http://127.0.0.1:8000`. Interactively test endpoints at `http://127.0.0.1:8000/docs`.

### Frontend Setup

The frontend runs independently as a static site.
- Serve the static files using a simple web server:
  ```bash
  cd frontend
  python -m http.server 8080
  ```
  Open `http://localhost:8080` in your browser.

---

## Testing & Verification

To run backend endpoint verification tests, navigate to the root directory and execute:
```bash
python -m unittest tests/verify.py
```

---

## Deployment Instructions

### Backend Deployment
1. Set the environment variables `HOST=0.0.0.0`, `DEBUG=false`, and load a secure `GOOGLE_TRANSLATE_API_KEY` on your hosting provider (e.g. AWS App Runner, Google Cloud Run, Heroku, or Render).
2. Start the production ASGI server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### Frontend Deployment
Host the `frontend/` directory statically on services like Google Cloud Storage buckets, Netlify, Vercel, or GitHub Pages. Adjust CORS `ALLOWED_ORIGINS` on the backend to authorize your frontend deployment domain.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
