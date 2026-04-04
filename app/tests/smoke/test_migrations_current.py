from alembic.config import Config
from alembic.script import ScriptDirectory


def test_migrations_current(smoke_connection):
    config = Config("alembic.ini")
    script = ScriptDirectory.from_config(config)
    heads = set(script.get_heads())
    current = {
        row[0]
        for row in smoke_connection.exec_driver_sql("SELECT version_num FROM alembic_version").fetchall()
    }
    assert current == heads
