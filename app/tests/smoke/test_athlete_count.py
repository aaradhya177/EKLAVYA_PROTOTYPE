from sqlalchemy import text


def test_athlete_count(smoke_connection):
    count = smoke_connection.execute(text("SELECT COUNT(*) FROM athletes")).scalar_one()
    assert int(count) > 0
