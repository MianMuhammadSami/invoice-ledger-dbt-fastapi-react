"""Create database schemas for dbt layers

Revision ID: 001
Revises:
Create Date: 2026-05-05

"""
from typing import Sequence, Union

from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # These schemas are owned by Alembic and consumed by dbt.
    # Order matters for downgrade: marts depends on intermediate depends on staging depends on raw.
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute("CREATE SCHEMA IF NOT EXISTS raw")
    op.execute("CREATE SCHEMA IF NOT EXISTS staging")
    op.execute("CREATE SCHEMA IF NOT EXISTS intermediate")
    op.execute("CREATE SCHEMA IF NOT EXISTS marts")


def downgrade() -> None:
    op.execute("DROP SCHEMA IF EXISTS marts CASCADE")
    op.execute("DROP SCHEMA IF EXISTS intermediate CASCADE")
    op.execute("DROP SCHEMA IF EXISTS staging CASCADE")
    op.execute("DROP SCHEMA IF EXISTS raw CASCADE")
