import pytest
from datetime import datetime, timezone, timedelta
from utils.datetime_utils import parse_datetime, to_iso_utc, normalize_datetime

def test_parse_datetime_naive():
    # Naive datetime should be parsed and assumed to be UTC
    naive_dt = datetime(2026, 7, 16, 9, 30, 0)
    parsed = parse_datetime(naive_dt)
    assert parsed.tzinfo is not None
    assert parsed.tzinfo == timezone.utc
    assert parsed.hour == 9

def test_parse_datetime_aware():
    # Aware datetime should be parsed and converted to UTC
    # 15:00 at +05:30 is 09:30 UTC
    aware_dt = datetime(2026, 7, 16, 15, 0, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))
    parsed = parse_datetime(aware_dt)
    assert parsed.tzinfo is not None
    assert parsed.tzinfo == timezone.utc
    assert parsed.hour == 9
    assert parsed.minute == 30

def test_parse_datetime_iso_string_z():
    iso_string = "2026-07-16T09:30:00Z"
    parsed = parse_datetime(iso_string)
    assert parsed.tzinfo is not None
    assert parsed.tzinfo == timezone.utc
    assert parsed.hour == 9

def test_parse_datetime_iso_string_offset():
    # 15:00 at +05:30 is 09:30 UTC
    iso_string = "2026-07-16T15:00:00+05:30"
    parsed = parse_datetime(iso_string)
    assert parsed.tzinfo is not None
    assert parsed.tzinfo == timezone.utc
    assert parsed.hour == 9
    assert parsed.minute == 30

def test_mixed_dataset_sorting():
    # Mix of naive, aware and string
    naive_dt = datetime(2026, 7, 15, 9, 30, 0) # 15th
    aware_dt = datetime(2026, 7, 16, 15, 0, 0, tzinfo=timezone(timedelta(hours=5, minutes=30))) # 16th 09:30 UTC
    iso_str = "2026-07-14T09:30:00Z" # 14th

    raw_dates = [naive_dt, aware_dt, iso_str]
    parsed_dates = [parse_datetime(d) for d in raw_dates]
    
    # Sort descending
    unique_dates = sorted(list(set(parsed_dates)), reverse=True)
    
    assert len(unique_dates) == 3
    assert unique_dates[0] == datetime(2026, 7, 16, 9, 30, 0, tzinfo=timezone.utc)
    assert unique_dates[1] == datetime(2026, 7, 15, 9, 30, 0, tzinfo=timezone.utc)
    assert unique_dates[2] == datetime(2026, 7, 14, 9, 30, 0, tzinfo=timezone.utc)

def test_to_iso_utc():
    naive_dt = datetime(2026, 7, 16, 9, 30, 0)
    iso_str = to_iso_utc(naive_dt)
    assert iso_str == "2026-07-16T09:30:00+00:00"
    
    aware_dt = datetime(2026, 7, 16, 15, 0, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))
    iso_str_aware = to_iso_utc(aware_dt)
    assert iso_str_aware == "2026-07-16T09:30:00+00:00"
