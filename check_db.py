from database.db_setup import engine
import sqlalchemy
with engine.connect() as conn:
    res = conn.execute(sqlalchemy.text("PRAGMA table_info(sessions)"))
    cols = [row[1] for row in res]
    print(f"Columns in sessions: {cols}")
    if "grupo" in cols:
        print("GRUPO EXISTS")
    else:
        print("GRUPO MISSING")
