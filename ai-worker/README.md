# AI Worker Microservice

AI integration and content moderation using FastAPI, PostgreSQL, and Google GenAI.

## Prerequisites

Before running this project, ensure you have the following installed:
- **Python 3.12+**
- **Poetry** (Python dependency management tool)
- **PostgreSQL** database (up and running)

## Setup and Installation

### 1. Install Dependencies

Using Poetry, install all required dependencies (this will also create a virtual environment):

```bash
poetry install
```

### 2. Environment Configuration

Copy the `.env.example` file to create your local `.env` configuration file:

```bash
cp .env.example .env
```

Open the newly created `.env` file and update the values to match your local setup (e.g., provide your actual `GEMINI_API_KEY`, `JWT_SECRET_KEY`, and update `DATABASE_URL` if necessary).

## Running the Application

Once your `.env` is configured and dependencies are installed, you can start the FastAPI application using Poetry:

### Using FastAPI CLI (Recommended for Development)

```bash
poetry run fastapi dev src/app/main.py
```

### Using Uvicorn

```bash
poetry run uvicorn src.app.main:app --reload
```

The application will now be running at `http://localhost:{someport}`. 
You can access the automatic interactive API documentation (Swagger UI) at `http://localhost:{someport}/docs`.