from sqlalchemy import inspect, text


def test_timescale_hypertables(smoke_connection):
    inspector = inspect(smoke_connection)
    table_names = set(inspector.get_table_names())
    assert "session_logs" in table_names
    if smoke_connection.dialect.name == "postgresql":
        hypertables = smoke_connection.execute(
            text("SELECT hypertable_name FROM timescaledb_information.hypertables WHERE hypertable_name = 'session_logs'")
        ).fetchall()
        assert hypertables
    result = smoke_connection.execute(text("SELECT COUNT(*) FROM session_logs")).scalar_one()
    assert int(result) >= 0
