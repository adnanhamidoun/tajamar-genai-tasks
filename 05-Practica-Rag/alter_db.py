import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv()

async def alter_table():
    db_url = os.getenv("DATABASE_URL")
    if db_url.startswith("mssql+pyodbc://"):
        db_url = db_url.replace("mssql+pyodbc://", "mssql+aioodbc://", 1)
        
    engine = create_async_engine(db_url)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE assistants ADD document_count INT NOT NULL DEFAULT 0"))
            print("Column added successfully.")
        except Exception as e:
            if "already exists" in str(e) or "Column names in each table must be unique" in str(e):
                print("Column already exists.")
            else:
                print(f"Error: {e}")
                
if __name__ == "__main__":
    asyncio.run(alter_table())
