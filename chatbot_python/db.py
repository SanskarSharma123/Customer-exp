from sqlalchemy import create_engine
from urllib.parse import quote_plus

DB_USER = "postgres"
DB_PASSWORD = quote_plus("hatebitches1") 
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "postgres2"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)