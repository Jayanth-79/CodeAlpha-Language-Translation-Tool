# Language Translation Tool

A production-ready translation web application featuring a decoupled FastAPI backend and a responsive Vanilla HTML5/CSS3/JavaScript frontend. This project is structured according to clean architecture guidelines to ensure modularity, scalability, and ease of testing.

## Features

- **Decoupled Architecture**: Independent frontend and backend components.
- **FastAPI Backend**: High-performance, asynchronous REST API.
- **Responsive Frontend**: Modern UI built with vanilla technologies (HTML5, CSS3, ES6 JavaScript).
- **LibreTranslate Integration**: Ready for self-hosted or cloud-based machine translation services.
- **Environment Configuration**: Structured environment variables for local development and production.

---

## Project Structure

```text
Language Translation Tool/
├── backend/
│   ├── app/
│   │   ├── api/            # API routing, request validation, and endpoint handlers
│   │   ├── services/       # Core business logic and external integrations (e.g., LibreTranslate)
│   │   ├── models/         # Pydantic schemas and database models (if applicable)
│   │   ├── utils/          # Helper modules, configuration classes, and common utilities
│   │   ├── static/         # Static assets (images, CSS, JS) served by the backend (optional)
│   │   └── templates/      # HTML templates served by the backend (optional)
│   ├── main.py             # Application entry point, CORS config, and middleware setup
│   ├── requirements.txt    # Production and development dependencies
│   └── .env.example        # Reference environment configuration file
├── frontend/
│   ├── css/                # Styling and layout stylesheets
│   ├── js/                 # Client-side routing, DOM manipulation, and API integration scripts
│   ├── assets/             # Images, icons, and logo resources
│   └── index.html          # Main application user interface markup
├── docs/                   # Architectural diagrams and developer documentation
├── screenshots/            # Visual previews of the application
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
- **External Services**:
  - LibreTranslate API (Machine translation engine)

---

## Getting Started

### Prerequisites
- Python 3.12 or higher installed on your system.
- Access to a LibreTranslate instance (local server or cloud service).

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
   Copy `.env.example` to `.env` and adjust the variables as needed:
   ```bash
   cp .env.example .env
   ```

6. Start the development server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be available at `http://127.0.0.1:8000`. You can view the interactive documentation at `http://127.0.0.1:8000/docs`.

### Frontend Setup

The frontend is a static application.
- You can host it using any static web server (such as Live Server, Nginx, or Python's `http.server`).
- To serve it using Python's built-in server, navigate to the `frontend` directory and run:
  ```bash
  python -m http.server 8080
  ```
  Open `http://localhost:8080` in your web browser.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
