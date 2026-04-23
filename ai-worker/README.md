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

### 3. AI Model Configuration

1. **Download Local Model**:
   Download the fine-tuned text model from [this Google Drive link](https://drive.google.com/file/d/1sh3e9qQFyR_1Y51wW_7HzbcZ1aAlTajp/view?usp=sharing).
2. **Extract Model**:
   Extract the downloaded file into a folder on your machine.
3. **Configure Model Paths**:
   Open `src/app/infrastructure/model_manager.py` and update `_TEXT_MODEL_ID` to point to the extracted folder:
   ```python
   _TEXT_MODEL_ID = r"D:\Learning\Fouth_Year\fine-tunning\my-final-toxic-model"
   ```
4. **Configure Hugging Face Cache** (Optional):
   If you want to customize the location where Hugging Face caches other models (like `openai/clip-vit-base-patch32`), you can set the `HF_HOME` environment variable inside `src/app/infrastructure/model_manager.py`:
   ```python
   import os
   os.environ["HF_HOME"] = "D:/AI_Cache"
   ```

### 4. Docker Volume Binding (For Docker Deployment)

When running the AI Worker in Docker, bind your local model directories to avoid re-downloading the ~2GB model each time:

**Update `docker-compose.yaml`** to mount the model directories:

```yaml
services:
  ai-worker:
    # ... other configuration ...
    volumes:
      # Bind local fine-tuned model (avoid re-downloading)
      - D:\Learning\Fouth_Year\fine-tunning\my-final-toxic-model:/app/models/text-model
      # Bind Hugging Face cache directory (optional, ~2GB+ for downloaded models)
      - D:\AI_Cache:/app/.hf_cache
    environment:
      # Point to the mounted model inside the container
      - HF_HOME=/app/.hf_cache
      # Update the model_manager.py to use the mounted path:
      # _TEXT_MODEL_ID = "/app/models/text-model"
```

**Or use Docker CLI**:

```bash
docker run -v D:\Learning\Fouth_Year\fine-tunning\my-final-toxic-model:/app/models/text-model \
           -v D:\AI_Cache:/app/.hf_cache \
           -e HF_HOME=/app/.hf_cache \
           devnexus-ai-worker
```

**Update the model path** in `src/app/infrastructure/model_manager.py`:

```python
import os

# For Docker containers, use the mounted path
_TEXT_MODEL_ID = "/app/models/text-model"

# Configure cache directory
os.environ["HF_HOME"] = os.getenv("HF_HOME", "/app/.hf_cache")
```

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