from sqlalchemy import text


def test_foreign_keys(smoke_connection):
    relationships = [
        "SELECT COUNT(*) FROM session_logs s JOIN athletes a ON a.id = s.athlete_id",
        "SELECT COUNT(*) FROM performance_indices p JOIN session_logs s ON s.id = p.session_id",
        "SELECT COUNT(*) FROM feature_snapshots f JOIN athletes a ON a.id = f.athlete_id",
    ]
    for query in relationships:
        count = smoke_connection.execute(text(query)).scalar_one()
        assert int(count) > 0
