"""
exceptions.py
=============
Repository exception classes for the Memory domain.
"""

class RepositoryError(Exception):
    """Base exception for all repository-related errors in the Memory domain."""
    pass

class DuplicateKeyError(RepositoryError):
    """Raised when attempting to insert a duplicate record."""
    pass

class ConnectionError(RepositoryError):
    """Raised when there is a database connection issue."""
    pass

class NotFoundError(RepositoryError):
    """Raised when an update or delete targets a non-existent record."""
    pass
