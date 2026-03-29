FROM python:3.12-slim

WORKDIR /app

# Install uv package manager
RUN pip install uv

# Copy dependency definition files
COPY pyproject.toml uv.lock ./

# Install dependencies into the system environment (or inside uv's virtual env)
RUN uv sync --frozen

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 8000

# Start FastAPI application using Uvicorn
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
