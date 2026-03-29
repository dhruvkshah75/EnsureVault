from typing import Optional, Generator
from mysql.connector import pooling
from mysql.connector.pooling import PooledMySQLConnection
from src.config import settings

connection_pool: Optional[pooling.MySQLConnectionPool] = None


def init_pool() -> None:
    """Initialize the MySQL connection pool. Called on app startup."""
    global connection_pool
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="ensurevault_pool",
        pool_size=5,
        pool_reset_session=True,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
    )


def close_pool() -> None:
    """Close all connections in the pool. Called on app shutdown."""
    global connection_pool
    connection_pool = None


def get_db() -> Generator[PooledMySQLConnection, None, None]:
    """
    FastAPI dependency that provides a database connection from the pool.
    Automatically returns the connection to the pool after the request.
    """
    if connection_pool is None:
        raise RuntimeError("Database pool is not initialized. Call init_pool() first.")
    conn = connection_pool.get_connection()
    try:
        yield conn
    finally:
        conn.close()
