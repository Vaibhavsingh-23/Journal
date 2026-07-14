"""
versioning.py
=============
Centralized version constants for the Capture Pipeline.

Purpose:
Maintains the versions of different components of the Knowledge Engine to
ensure backward compatibility and smooth migrations when schemas or prompts change.

Expected Future PRs:
- Integration with migration scripts when schema changes.
- Loading different prompt versions based on active experiments.
"""

SCHEMA_VERSION = "1.0.0"
PROMPT_VERSION = "1.0.0"
PIPELINE_VERSION = "1.0.0"
