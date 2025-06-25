from sqlalchemy import create_engine, text
DB_USER = "postgres"
DB_PASSWORD = "Helloace@135"
DB_HOST = "localhost"
DB_PORT = "5433"
DB_NAME = "database3"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)