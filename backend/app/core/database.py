import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

def _load_local_env():
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return

    raw_env = env_path.read_bytes()
    encoding = "utf-16" if raw_env.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8-sig"
    for line in raw_env.decode(encoding).splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_local_env()

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/provenance_db"
)

# 1. Create engine (Required by main.py)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# 2. Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Declarative Base (Required by main.py and models)
Base = declarative_base()

# 4. Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()