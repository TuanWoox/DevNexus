# ---- Builder Stage ----
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install --no-cache-dir poetry

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    VIRTUAL_ENV=/opt/venv

# Install dependencies
RUN poetry install --no-interaction --no-ansi --no-root

# ---- Final Stage ----
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies (IMPORTANT for sentencepiece)
RUN apt-get update && apt-get install -y \
    libpq5 \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Ensure venv is used
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH=/app

# (Extra safety) Ensure tokenizer deps are properly available
RUN pip install --no-cache-dir sentencepiece tiktoken

# Copy application source code
COPY src/ ./src/
COPY .env .

# Expose the API port
EXPOSE 8000

# Start the application (more stable than `fastapi run`)
CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000"]