import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DB_HOST: str = os.getenv("DB_HOST", "localhost") or "localhost"
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "root") or "root"
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "") or ""
    DB_NAME: str = os.getenv("DB_NAME", "ensurevault") or "ensurevault"

    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000") or "http://localhost:3000"
    API_V1_PREFIX: str = "/api/v1"


settings = Settings()
