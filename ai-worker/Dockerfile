
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for typical Python AI/DB packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install --no-cache-dir poetry

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Configure poetry to not create a virtual environment since Docker itself provides isolation
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# Copy the actual application source code
COPY src/ ./src/

# Set Python path so imports from src work smoothly
ENV PYTHONPATH=/app

# Expose the API port
EXPOSE 8000

# Start the application
CMD ["fastapi", "run", "src/app/main.py", "--host", "0.0.0.0", "--port", "8000"]
