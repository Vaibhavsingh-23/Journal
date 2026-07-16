import datetime
from typing import Union

def normalize_datetime(dt: datetime.datetime) -> datetime.datetime:
    """
    Ensure a datetime object is timezone-aware and converted to UTC.
    If naive, assumes UTC.
    """
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        return dt.replace(tzinfo=datetime.timezone.utc)
    return dt.astimezone(datetime.timezone.utc)

def parse_datetime(raw_date: Union[str, datetime.datetime]) -> datetime.datetime:
    """
    Parse a string or datetime object, converting it to a timezone-aware UTC datetime.
    """
    if isinstance(raw_date, datetime.datetime):
        return normalize_datetime(raw_date)
    
    if isinstance(raw_date, str) and raw_date:
        # fromisoformat handles standard ISO 8601 but sometimes Z needs to be +00:00
        raw_date_str = raw_date.replace("Z", "+00:00")
        try:
            dt = datetime.datetime.fromisoformat(raw_date_str)
            return normalize_datetime(dt)
        except ValueError:
            pass
            
    raise ValueError(f"Cannot parse datetime from: {raw_date}")

def to_iso_utc(val: Union[str, datetime.datetime]) -> str:
    """
    Convert a datetime or string to the canonical UTC ISO-8601 string representation.
    """
    try:
        dt = parse_datetime(val)
        return dt.isoformat()
    except ValueError:
        return ""
